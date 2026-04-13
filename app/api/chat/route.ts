import { NextRequest } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { buildToolset } from "@/lib/tools";
import { upsertUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

function getProvider(model: string) {
  if (model.startsWith("claude")) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    return anthropic(model);
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return openai(model);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const rl = checkRateLimit(`chat:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
    });
  }

  const body = await req.json();
  const {
    agentId,
    conversationId: existingConvId,
    // v6 sends messages array of UIMessage parts
    messages: clientMessages,
  } = body as {
    agentId: string;
    conversationId?: string;
    messages: Array<{
      role: string;
      content?: string;
      parts?: Array<{ type: string; text?: string }>;
    }>;
  };

  console.log(`[POST /api/chat] agentId=${agentId} conversationId=${existingConvId ?? "new"}`);

  // Load agent fresh from DB on every request
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404 });
  }

  const dbUser = await upsertUser(user);
  if (!dbUser) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  // Get or create conversation
  let conversationId = existingConvId;
  if (!conversationId) {
    // Get first user message text for title
    const firstMsg = clientMessages.find((m) => m.role === "user");
    const firstText = firstMsg?.parts?.find((p) => p.type === "text")?.text
      ?? firstMsg?.content
      ?? "";
    const title = firstText.slice(0, 60) || "New conversation";
    const conv = await prisma.conversation.create({
      data: { agentId, userId: dbUser.id, title },
    });
    conversationId = conv.id;
  }

  // Build tool set
  const tools = await buildToolset(agent, conversationId);

  // Convert messages to CoreMessage format
  const coreMessages: ModelMessage[] = clientMessages.map((m) => {
    const text = m.parts?.find((p) => p.type === "text")?.text ?? m.content ?? "";
    return { role: m.role as "user" | "assistant", content: text };
  });

  const model = getProvider(agent.model);

  const result = streamText({
    model,
    system: agent.systemPrompt,
    messages: coreMessages,
    tools,
    stopWhen: stepCountIs(10),
    temperature: agent.temperature,
    maxOutputTokens: agent.maxTokens ?? undefined,
    onFinish: async ({ text, steps, usage }) => {
      // Collect tool calls + results from ALL steps (onFinish.toolCalls is last-step only)
      const allToolCalls = steps.flatMap((s) => s.toolCalls ?? []);
      const allToolResults = steps.flatMap((s) => s.toolResults ?? []);

      // Persist last user message
      const lastUser = [...clientMessages].reverse().find((m) => m.role === "user");
      if (lastUser) {
        const userText = lastUser.parts?.find((p) => p.type === "text")?.text ?? lastUser.content ?? "";
        if (userText) {
          await prisma.message.create({
            data: { conversationId: conversationId!, role: "user", content: userText },
          });
        }
      }

      // Persist assistant message (save even if text is empty as long as tool calls exist)
      if (text || allToolCalls.length > 0) {
        await prisma.message.create({
          data: {
            conversationId: conversationId!,
            role: "assistant",
            content: text,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toolCalls: allToolCalls.length ? (allToolCalls as any) : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toolResults: allToolResults.length ? (allToolResults as any) : undefined,
          },
        });
      }

      console.log(`[POST /api/chat] agentId=${agentId} conversationId=${conversationId} toolCalls=${allToolCalls.length} tokens=${usage?.totalTokens}`);
    },
  });

  // Return UI message stream response (compatible with AI SDK v6 useChat)
  const response = result.toUIMessageStreamResponse({
    headers: {
      "X-Conversation-Id": conversationId,
    },
  });

  return response;
}
