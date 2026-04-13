import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/auth";
import { z } from "zod";

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullish(),
  emoji: z.string().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(256).max(32000).optional(),
  enabledTools: z.array(z.string()).optional(),
  workflowTools: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

async function getOwnedAgent(agentId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.id },
  });
  return agent;
}

// GET /api/agents/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getOwnedAgent(id, user.email);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Also fetch user's workflows for workflow tool toggles
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  const workflows = dbUser
    ? await prisma.workflow.findMany({
        where: { userId: dbUser.id },
        select: { id: true, name: true, emoji: true, description: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return NextResponse.json({ data: agent, workflows });
}

// PUT /api/agents/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getOwnedAgent(id, user.email);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  console.log(`[PUT /api/agents/${id}] userId=${agent.userId}`);

  const updated = await prisma.agent.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/agents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getOwnedAgent(id, user.email);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  console.log(`[DELETE /api/agents/${id}] userId=${agent.userId}`);

  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
