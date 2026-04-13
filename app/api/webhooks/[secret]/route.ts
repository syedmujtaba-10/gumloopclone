import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/lib/workflow/executor";

export const maxDuration = 120;

// POST /api/webhooks/[secret] — public, triggers workflow execution
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // Find workflow by webhook secret
  const workflow = await prisma.workflow.findUnique({
    where: { webhookSecret: secret },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  // Parse request body (limit 1MB)
  let input: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text.length > 1_000_000) {
      return NextResponse.json({ error: "Request body too large (max 1MB)" }, { status: 413 });
    }
    input = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runId = crypto.randomUUID();
  console.log(`[POST /api/webhooks/${secret.slice(0, 8)}…] workflowId=${workflow.id} runId=${runId}`);

  try {
    const output = await executeWorkflow(workflow.id, input, runId);
    return NextResponse.json({ success: true, runId, output });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[POST /api/webhooks/…] workflowId=${workflow.id} runId=${runId} error="${error}"`);
    return NextResponse.json({ success: false, runId, error }, { status: 500 });
  }
}
