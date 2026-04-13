import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow/executor";
import type { WorkflowSSEEvent } from "@/types";

export const maxDuration = 120;

// POST /api/workflows/[id]/run — trigger a run, stream SSE
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  const workflow = await prisma.workflow.findFirst({ where: { id, userId: dbUser?.id } });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const input = body.input ?? {};
  const runId = crypto.randomUUID();

  console.log(`[POST /api/workflows/${id}/run] runId=${runId} userId=${dbUser?.id}`);

  // Return SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function emit(event: WorkflowSSEEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      try {
        await executeWorkflow(id, input, runId, emit);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        emit({ type: "workflow_error", error, runId });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Run-Id": runId,
    },
  });
}
