export interface ScrapeResult {
  content: string;
  title: string;
  url: string;
}

/**
 * Scrape a URL using Firecrawl and return cleaned content.
 * Requires FIRECRAWL_API_KEY environment variable.
 */
export async function scrapeUrl(
  url: string,
  format: "markdown" | "text" = "markdown"
): Promise<ScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");

  const { default: FirecrawlApp } = await import("firecrawl");
  const app = new FirecrawlApp({ apiKey });

  // SDK v1 uses app.scrape (renamed from scrapeUrl in older versions)
  const result = await app.scrape(url, { formats: [format === "text" ? "markdown" : "markdown"] });

  const content = result.markdown ?? "";
  if (!content && result.metadata?.error) {
    throw new Error(`Firecrawl scrape failed for ${url}: ${result.metadata.error}`);
  }

  return {
    content,
    title: result.metadata?.title ?? "",
    url: result.metadata?.sourceURL ?? result.metadata?.url ?? url,
  };
}
