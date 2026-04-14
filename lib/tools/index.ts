import { webSearchTool } from "./web-search";
import { webScrapeTool } from "./web-scrape";
import { imageGenTool } from "./image-gen";
import { httpRequestTool } from "./http-request";
import { sandboxPythonTool } from "./sandbox-python";
import { sandboxShellTool } from "./sandbox-shell";
import { sandboxFileTool } from "./sandbox-file";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { tool } from "ai";
import type { Agent } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic tool map required
type ToolMap = Record<string, ReturnType<typeof tool<any, any>>>;

/**
 * Build the full tool set for an agent for a given conversation.
 * Reads agent.enabledTools + agent.workflowTools to construct the toolset.
 */
export async function buildToolset(agent: Agent, conversationId: string): Promise<ToolMap> {
  const tools: ToolMap = {};

  for (const toolName of agent.enabledTools) {
    switch (toolName) {
      case "web_search":
        tools.web_search = webSearchTool;
        break;
      case "web_scrape":
        tools.web_scrape = webScrapeTool;
        break;
      case "image_gen":
        tools.image_gen = imageGenTool;
        break;
      case "http_request":
        tools.http_request = httpRequestTool;
        break;
      case "sandbox_python":
        tools.sandbox_python = sandboxPythonTool(conversationId);
        break;
      case "sandbox_shell":
        tools.sandbox_shell = sandboxShellTool(conversationId);
        break;
      case "sandbox_file":
        tools.sandbox_file = sandboxFileTool(conversationId);
        break;
    }
  }

  // Add workflow tools
  if (agent.workflowTools.length > 0) {
    const workflows = await prisma.workflow.findMany({
      where: { id: { in: agent.workflowTools } },
      select: { id: true, name: true, description: true, nodes: true, edges: true },
    });

    for (const wf of workflows) {
      const toolName = `workflow_${wf.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      tools[toolName] = tool({
        description:
          wf.description ??
          `Run the "${wf.name}" workflow automation. Use this when you need to execute the automated pipeline for ${wf.name}.`,
        inputSchema: z.object({
          input: z.string().describe("Input data to pass to the workflow"),
        }),
        execute: async ({ input }) => {
          console.log(`[tool:workflow_${wf.name}] workflowId=${wf.id}`);
          // Dynamic import to avoid circular dep
          const { executeWorkflow } = await import("@/lib/workflow/executor");
          const runId = crypto.randomUUID();
          const result = await executeWorkflow(wf.id, { input }, runId);
          // Return structured object directly so agent gets usable JSON data;
          // wrap strings/primitives for clarity
          if (result !== null && typeof result === "object") {
            return result as Record<string, unknown>;
          }
          return { output: result };
        },
      });
    }
  }

  return tools;
}
