import { prisma } from "@/lib/prisma";
import type { WorkflowSSEEvent } from "@/types";

interface FlowNode {
  id: string;
  type: string;
  data: {
    nodeType: string;
    label: string;
    config: Record<string, unknown>;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface NodeResult {
  nodeId: string;
  nodeType: string;
  input: unknown;
  output: unknown;
  error: string | null;
  durationMs: number;
}

type SSEEmitter = (event: WorkflowSSEEvent) => void;

/**
 * Topological sort using Kahn's algorithm.
 * Returns nodes in execution order.
 */
function topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: FlowNode[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find((n) => n.id === nodeId);
    if (node) sorted.push(node);

    for (const neighbor of adj.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

/**
 * Resolve {{nodeId.output}} template references in a string.
 */
function resolveTemplate(template: string, outputs: Map<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const parts = key.trim().split(".");
    if (parts[0] === "input") return outputs.get("__input__") as string ?? "";

    const nodeOutput = outputs.get(parts[0]);
    if (parts.length === 1) return String(nodeOutput ?? "");

    // Navigate nested path
    let val: unknown = nodeOutput;
    for (let i = 1; i < parts.length; i++) {
      val = (val as Record<string, unknown>)?.[parts[i]];
    }
    return String(val ?? "");
  });
}

/**
 * Execute a single workflow node.
 */
async function executeNode(
  node: FlowNode,
  outputs: Map<string, unknown>
): Promise<unknown> {
  const config = node.data.config ?? {};
  const nodeType = node.data.nodeType ?? node.type;

  switch (nodeType) {
    case "trigger": {
      return outputs.get("__input__") ?? config.defaultInput ?? null;
    }

    case "llm": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const { generateText } = await import("ai");
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const prompt = resolveTemplate(String(config.prompt ?? "{{input}}"), outputs);
      const systemPrompt = String(config.systemPrompt ?? "You are a helpful assistant.");
      const model = String(config.model ?? "claude-haiku-4-5-20251001");

      const { text } = await generateText({
        model: anthropic(model),
        system: systemPrompt,
        prompt,
        maxOutputTokens: Number(config.maxTokens ?? 1024),
      });
      return text;
    }

    case "http_request": {
      const url = resolveTemplate(String(config.url ?? ""), outputs);
      const method = String(config.method ?? "GET");
      const body = config.body ? resolveTemplate(String(config.body), outputs) : undefined;
      const headers = config.headers as Record<string, string> | undefined;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body,
        signal: AbortSignal.timeout(15000),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) return res.json();
      return res.text();
    }

    case "code": {
      const { getOrCreateSandbox } = await import("@/lib/sandbox-manager");
      const code = resolveTemplate(String(config.code ?? "print('Hello')"), outputs);
      // Use a dummy conversation id for workflow sandboxes
      const sandboxId = `workflow_tmp_${Date.now()}`;
      const sandbox = await getOrCreateSandbox(sandboxId);
      const execution = await sandbox.runCode(code);
      return {
        stdout: execution.logs.stdout.join(""),
        stderr: execution.logs.stderr.join(""),
        error: execution.error?.value ?? null,
      };
    }

    case "condition": {
      const expression = resolveTemplate(String(config.expression ?? "true"), outputs);
      try {
        // eslint-disable-next-line no-new-func -- safe eval of simple condition
        const result = new Function("input", `return (${expression})`)(outputs.get("__input__"));
        return { result: Boolean(result), branch: Boolean(result) ? "true" : "false" };
      } catch {
        return { result: false, branch: "false" };
      }
    }

    case "output": {
      const template = String(config.template ?? "{{input}}");
      const format = String(config.format ?? "text");

      let resolved: unknown;

      // Default {{input}} template: use the last preceding node's output rather than
      // just the trigger input, so the output node "passes through" the pipeline result.
      if (template === "{{input}}") {
        const nonInputEntries = [...outputs.entries()].filter(([k]) => k !== "__input__");
        if (nonInputEntries.length > 0) {
          resolved = nonInputEntries[nonInputEntries.length - 1][1];
        } else {
          resolved = outputs.get("__input__") ?? null;
        }
      } else {
        resolved = resolveTemplate(template, outputs);
      }

      // Enforce json format: parse string → object so agent gets structured data
      if (format === "json") {
        if (typeof resolved === "string") {
          try { return JSON.parse(resolved); } catch { /* return as-is if not valid JSON */ }
        }
        // Already an object — return directly
        return resolved;
      }

      return resolved;
    }

    default:
      return null;
  }
}

/**
 * Execute a workflow by ID.
 * Optionally accepts an SSE emitter for real-time canvas updates.
 */
export async function executeWorkflow(
  workflowId: string,
  input: Record<string, unknown>,
  runId: string,
  emit?: SSEEmitter
): Promise<unknown> {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

  const nodes = workflow.nodes as unknown as FlowNode[];
  const edges = workflow.edges as unknown as FlowEdge[];

  // Create/update run record
  await prisma.workflowRun.upsert({
    where: { id: runId },
    create: {
      id: runId,
      workflowId,
      status: "running",
      trigger: "manual",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: input as any,
      startedAt: new Date(),
    },
    update: { status: "running" },
  });

  const sortedNodes = topologicalSort(nodes, edges);
  const outputs = new Map<string, unknown>();
  outputs.set("__input__", input.input ?? JSON.stringify(input));

  const nodeResults: NodeResult[] = [];
  let finalOutput: unknown = null;

  try {
    for (const node of sortedNodes) {
      const start = Date.now();
      emit?.({ type: "node_start", nodeId: node.id, nodeType: node.data.nodeType, runId });

      try {
        const output = await executeNode(node, outputs);
        outputs.set(node.id, output);

        const durationMs = Date.now() - start;
        nodeResults.push({ nodeId: node.id, nodeType: node.data.nodeType, input: null, output, error: null, durationMs });
        emit?.({ type: "node_complete", nodeId: node.id, output, duration: durationMs, runId });

        // Track last output node as final output
        if (node.data.nodeType === "output" || node.type === "output") {
          finalOutput = output;
        }
      } catch (nodeErr) {
        const error = nodeErr instanceof Error ? nodeErr.message : String(nodeErr);
        const durationMs = Date.now() - start;
        nodeResults.push({ nodeId: node.id, nodeType: node.data.nodeType, input: null, output: null, error, durationMs });
        emit?.({ type: "node_error", nodeId: node.id, error, duration: durationMs, runId });
        console.error(`[workflow:node] workflowId=${workflowId} nodeId=${node.id} type=${node.data.nodeType} error="${error}"`);
        // Continue on error — don't crash the whole workflow
      }
    }

    // If no explicit output node, use last node's output
    if (finalOutput === null && sortedNodes.length > 0) {
      const lastNode = sortedNodes[sortedNodes.length - 1];
      finalOutput = outputs.get(lastNode.id) ?? null;
    }

    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: "success",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output: finalOutput as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeResults: nodeResults as any,
        finishedAt: new Date(),
      },
    });

    emit?.({ type: "workflow_complete", output: finalOutput, runId });
    return finalOutput;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.workflowRun.update({
      where: { id: runId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: "error", error, finishedAt: new Date(), nodeResults: nodeResults as any },
    });
    emit?.({ type: "workflow_error", error, runId });
    throw err;
  }
}
