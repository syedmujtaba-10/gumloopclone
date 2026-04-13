import { z } from "zod";
import { tool } from "ai";
import { getOrCreateSandbox } from "@/lib/sandbox-manager";

export function sandboxShellTool(conversationId: string) {
  return tool({
    description:
      "Run bash shell commands in an isolated Linux VM. The same VM is shared with the Python sandbox in this conversation — files you write are accessible. Good for file operations, package management, running scripts, and system commands.",
    inputSchema: z.object({
      command: z.string().describe("Shell command to execute"),
    }),
    execute: async ({ command }) => {
      console.log(`[tool:sandbox_shell] conversationId=${conversationId} command="${command.slice(0, 100)}"`);
      const start = Date.now();

      try {
        const sandbox = await getOrCreateSandbox(conversationId);
        const result = await sandbox.commands.run(command, { timeoutMs: 30000 });
        const took = Date.now() - start;
        console.log(`[tool:sandbox_shell] conversationId=${conversationId} exitCode=${result.exitCode} took=${took}ms`);

        return {
          success: result.exitCode === 0,
          stdout: result.stdout || null,
          stderr: result.stderr || null,
          exitCode: result.exitCode,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[tool:sandbox_shell] conversationId=${conversationId} failed error="${message}"`);
        return { success: false, error: message };
      }
    },
  });
}
