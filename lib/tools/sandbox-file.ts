import { z } from "zod";
import { tool } from "ai";
import { getOrCreateSandbox } from "@/lib/sandbox-manager";

export function sandboxFileTool(conversationId: string) {
  return tool({
    description:
      "Read or write files inside the isolated VM sandbox. Files persist across tool calls in this conversation. Use this to save intermediate results, read uploaded files, or manage data between Python/shell executions.",
    inputSchema: z.object({
      operation: z.enum(["read", "write", "list"]).describe("Operation to perform"),
      path: z.string().describe("File path in the VM (e.g. /home/user/data.csv)"),
      content: z
        .string()
        .optional()
        .describe("Content to write (required for 'write' operation)"),
    }),
    execute: async ({ operation, path, content }) => {
      console.log(`[tool:sandbox_file] conversationId=${conversationId} op=${operation} path="${path}"`);

      try {
        const sandbox = await getOrCreateSandbox(conversationId);

        if (operation === "read") {
          const fileContent = await sandbox.files.read(path);
          return { success: true, content: fileContent };
        }

        if (operation === "write") {
          if (!content) return { success: false, error: "Content is required for write operation" };
          await sandbox.files.write(path, content);
          return { success: true, message: `File written to ${path}` };
        }

        if (operation === "list") {
          const dirPath = path.endsWith("/") ? path : path + "/";
          const entries = await sandbox.files.list(dirPath);
          return { success: true, entries };
        }

        return { success: false, error: "Unknown operation" };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[tool:sandbox_file] conversationId=${conversationId} op=${operation} failed error="${message}"`);
        return { success: false, error: message };
      }
    },
  });
}
