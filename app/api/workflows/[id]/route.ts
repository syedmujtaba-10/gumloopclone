import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  // null = clear the schedule, string = set/update the schedule
  cronExpression: z.string().nullable().optional(),
});

async function getOwnedWorkflow(workflowId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  return prisma.workflow.findFirst({ where: { id: workflowId, userId: user.id } });
}

// GET /api/workflows/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getOwnedWorkflow(id, user.email);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: workflow });
}

// PUT /api/workflows/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getOwnedWorkflow(id, user.email);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  console.log(`[PUT /api/workflows/${id}] cron=${parsed.data.cronExpression ?? "none"}`);

  // Calculate nextRunAt when cron is set/changed; clear it when cron is removed
  let nextRunAt: Date | null | undefined = undefined; // undefined = don't touch
  if ("cronExpression" in parsed.data) {
    if (parsed.data.cronExpression) {
      try {
        const { Cron } = await import("croner");
        nextRunAt = new Cron(parsed.data.cronExpression).nextRun() ?? null;
      } catch {
        return NextResponse.json({ error: "Invalid cron expression" }, { status: 400 });
      }
    } else {
      nextRunAt = null; // clear schedule
    }
  }

  const updateData = {
    ...parsed.data,
    ...(nextRunAt !== undefined ? { nextRunAt } : {}),
  };

  const updated = await prisma.workflow.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/workflows/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getOwnedWorkflow(id, user.email);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  console.log(`[DELETE /api/workflows/${id}]`);
  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
