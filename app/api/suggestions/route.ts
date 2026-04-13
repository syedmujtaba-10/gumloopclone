import { NextRequest, NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  const { lastAssistantMessage, userMessage } = await req.json();

  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system:
        "You are a helpful assistant. Generate exactly 3 short follow-up question suggestions based on the conversation context. Return ONLY a JSON array of 3 strings, no markdown, no explanation. Each suggestion should be under 60 characters.",
      prompt: `User asked: "${userMessage}"\n\nAssistant responded: "${lastAssistantMessage?.slice(0, 300)}"\n\nGenerate 3 follow-up suggestions as a JSON array.`,
      maxOutputTokens: 200,
    });

    // Parse the response - expect JSON array
    const cleaned = text.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const suggestions = JSON.parse(cleaned);

    if (!Array.isArray(suggestions)) throw new Error("Not an array");
    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch {
    // Fallback suggestions
    return NextResponse.json({
      suggestions: [
        "Can you elaborate on that?",
        "What are the next steps?",
        "Can you give an example?",
      ],
    });
  }
}
