import { z } from "zod";
import { tool } from "ai";

export const webSearchTool = tool({
  description:
    "Search the web for real-time information. Use this when you need current events, facts, prices, or any information that may have changed recently.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z.number().optional().default(5).describe("Number of results to return (1-10)"),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    console.log(`[tool:web_search] query="${query}"`);
    const start = Date.now();

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: Math.min(maxResults, 10),
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!res.ok) {
      const err = `Tavily search failed status=${res.status}`;
      console.error(`[tool:web_search] ${err} query="${query}"`);
      return { success: false, error: err };
    }

    const data = await res.json();
    const took = Date.now() - start;
    console.log(`[tool:web_search] query="${query}" results=${data.results?.length ?? 0} took=${took}ms`);

    return {
      success: true,
      answer: data.answer ?? null,
      results: (data.results ?? []).map((r: Record<string, unknown>) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        score: r.score,
      })),
    };
  },
});
