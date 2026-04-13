import { tool } from "ai";
import { z } from "zod";

export const webScrapeTool = tool({
  description:
    "Scrape and read the full content of any web page as clean markdown text. Use this to read articles, documentation, blog posts, or any public URL.",
  inputSchema: z.object({
    url: z.string().describe("Full URL to scrape, including https://"),
    format: z
      .enum(["markdown", "text"])
      .optional()
      .default("markdown")
      .describe("Output format — markdown (default) or plain text"),
  }),
  execute: async ({ url, format }) => {
    console.log(`[tool:web_scrape] url=${url} format=${format}`);
    const { scrapeUrl } = await import("@/lib/tools/firecrawl");
    try {
      const result = await scrapeUrl(url, format ?? "markdown");
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[tool:web_scrape] url=${url} error="${msg}"`);
      return { error: msg, content: "", title: "", url };
    }
  },
});
