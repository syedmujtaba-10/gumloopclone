import { z } from "zod";
import { tool } from "ai";

// Block internal/private IP ranges
const BLOCKED_PREFIXES = [
  "localhost",
  "127.",
  "0.0.0.0",
  "10.",
  "192.168.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "169.254.",
  "::1",
  "fc00:",
  "fd",
];

function isBlockedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return BLOCKED_PREFIXES.some((p) => hostname.startsWith(p));
  } catch {
    return true;
  }
}

export const httpRequestTool = tool({
  description:
    "Make an HTTP request to any external API or URL. Supports GET, POST, PUT, DELETE with custom headers and body.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to call"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe("HTTP headers as key-value pairs"),
    body: z
      .string()
      .optional()
      .describe("Request body (JSON string or plain text)"),
  }),
  execute: async ({ url, method = "GET", headers, body }) => {
    if (isBlockedUrl(url)) {
      return { success: false, error: "Requests to internal/private addresses are not allowed." };
    }

    console.log(`[tool:http_request] ${method} ${url}`);
    const start = Date.now();

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ?? undefined,
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      const contentType = res.headers.get("content-type") ?? "";
      let responseBody: unknown;

      if (contentType.includes("application/json")) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      const took = Date.now() - start;
      console.log(`[tool:http_request] ${method} ${url} status=${res.status} took=${took}ms`);

      return {
        success: true,
        status: res.status,
        statusText: res.statusText,
        body: responseBody,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[tool:http_request] ${method} ${url} failed error="${message}"`);
      return { success: false, error: message };
    }
  },
});
