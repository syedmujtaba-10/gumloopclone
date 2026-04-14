import { NextRequest } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { buildToolset } from "@/lib/tools";
import { upsertUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * After convertToModelMessages, scan for assistant messages that have tool-call
 * parts without a matching tool-result in the immediately following message.
 * Anthropic (Claude) strictly requires tool_use → tool_result to be adjacent.
 * Such orphans arise when a prior request errored mid-stream (tool executed but
 * the second Anthropic call failed), leaving a half-recorded assistant message in
 * the client's useChat state.
 *
 * Fix: strip orphaned tool-call parts from the assistant message. If that leaves
 * the message empty, remove it entirely.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ModelMessage types vary across SDK versions
function repairOrphanedToolCalls(messages: any[]): any[] {
  const out: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role !== "assistant" || !Array.isArray(msg.content)) {
      out.push(msg);
      continue;
    }

    const toolCalls: string[] = msg.content
      .filter((p: any) => p.type === "tool-call")
      .map((p: any) => p.toolCallId as string);

    if (toolCalls.length === 0) {
      out.push(msg);
      continue;
    }

    // Gather tool-result IDs from the immediately following message
    const next = messages[i + 1];
    const resultIds = new Set<string>(
      (Array.isArray(next?.content) ? next.content : [])
        .filter((p: any) => p.type === "tool-result")
        .map((p: any) => p.toolCallId as string)
    );

    const orphans = new Set(toolCalls.filter((id) => !resultIds.has(id)));
    if (orphans.size === 0) {
      out.push(msg);
      continue;
    }

    console.warn(
      `[chat] repairing orphaned tool_use(s): ${[...orphans].join(", ")} — stripping from history`
    );

    // Strip orphaned tool-call parts (keep text / reasoning parts)
    const repaired = msg.content.filter(
      (p: any) => p.type !== "tool-call" || !orphans.has(p.toolCallId)
    );

    if (repaired.length > 0) {
      out.push({ ...msg, content: repaired });
    }
    // else: drop the whole message (it was tool-call-only with no valid parts)
  }

  return out;
}

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
    messages: clientMessages,
  } = body as {
    agentId: string;
    conversationId?: string;
    messages: UIMessage[];
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
    const firstMsg = clientMessages.find((m) => m.role === "user");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UIMessagePart subtypes vary
    const firstText: string = (firstMsg?.parts?.find((p) => p.type === "text") as any)?.text ?? "";
    const title = firstText.slice(0, 60) || "New conversation";
    const conv = await prisma.conversation.create({
      data: { agentId, userId: dbUser.id, title },
    });
    conversationId = conv.id;
  }

  // Build tool set
  const tools = await buildToolset(agent, conversationId);

  // Strip tool-call parts that never completed (state != "output-available").
  // This can happen when a previous request errored mid-stream — the assistant
  // message records a tool_use but the tool_result was never written. Anthropic
  // rejects any sequence where tool_use lacks a matching tool_result.
  const sanitizedMessages = clientMessages.map((m) => {
    if (m.role !== "assistant" || !m.parts) return m;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UIMessagePart subtypes vary
    const parts = (m.parts as any[]).filter((p: any) => {
      // Keep all non-tool parts
      if (typeof p.type !== "string" || !p.type.startsWith("tool-")) return true;
      // Only keep tool parts that have a completed output
      return p.state === "output-available" || p.state === "output-error";
    });
    return { ...m, parts };
  });

  // Convert UIMessage[] → ModelMessage[], then repair any orphaned tool-call
  // blocks left behind by prior requests that errored mid-stream.
  const rawMessages = await convertToModelMessages(sanitizedMessages);
  const coreMessages = repairOrphanedToolCalls(rawMessages);

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

      // Persist last user message (extract text from parts)
      const lastUser = [...clientMessages].reverse().find((m) => m.role === "user");
      if (lastUser) {
        const textPart = lastUser.parts?.find((p) => p.type === "text");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UIMessagePart text field varies by part type
        const userText: string = (textPart as any)?.text ?? "";
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
