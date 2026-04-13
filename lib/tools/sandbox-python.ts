import { z } from "zod";
import { tool } from "ai";
import { getOrCreateSandbox } from "@/lib/sandbox-manager";

export function sandboxPythonTool(conversationId: string) {
  return tool({
    description:
      "Execute Python code in an isolated Linux VM. The VM persists across calls in this conversation — variables, files, and installed packages are available between executions. Great for data analysis, calculations, file processing, and automation.",
    inputSchema: z.object({
      code: z.string().describe("Python code to execute"),
      installPackages: z
        .array(z.string())
        .optional()
        .describe("pip packages to install before running (e.g. ['pandas', 'matplotlib'])"),
    }),
    execute: async ({ code, installPackages }) => {
      console.log(`[tool:sandbox_python] conversationId=${conversationId} codeLen=${code.length}`);
      const start = Date.now();

      try {
        const sandbox = await getOrCreateSandbox(conversationId);

        // Install packages if requested
        if (installPackages?.length) {
          const installCmd = `pip install -q ${installPackages.join(" ")}`;
          await sandbox.commands.run(installCmd);
          console.log(`[tool:sandbox_python] installed packages: ${installPackages.join(", ")}`);
        }

        const execution = await sandbox.runCode(code);
        const took = Date.now() - start;
        console.log(`[tool:sandbox_python] conversationId=${conversationId} took=${took}ms`);

        return {
          success: true,
          stdout: execution.logs.stdout.join("") || null,
          stderr: execution.logs.stderr.join("") || null,
          error: execution.error ? `${execution.error.name}: ${execution.error.value}` : null,
          artifacts: execution.results
            .filter((r) => r.png || r.jpeg || r.svg)
            .map((r) => ({
              type: r.png ? "image/png" : r.jpeg ? "image/jpeg" : "image/svg+xml",
              data: r.png ?? r.jpeg ?? r.svg,
            })),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[tool:sandbox_python] conversationId=${conversationId} failed error="${message}"`);
        return { success: false, error: message };
      }
    },
  });
}
