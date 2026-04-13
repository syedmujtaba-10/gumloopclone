import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  emoji: z.string().optional(),
});

// GET /api/workflows
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser) return NextResponse.json({ data: [] });

  const workflows = await prisma.workflow.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  return NextResponse.json({ data: workflows });
}

// POST /api/workflows
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await upsertUser(user);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = CreateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  console.log(`[POST /api/workflows] userId=${dbUser.id} name="${parsed.data.name}"`);

  const workflow = await prisma.workflow.create({
    data: {
      userId: dbUser.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      emoji: parsed.data.emoji ?? "⚡",
      webhookSecret: randomUUID(),
      nodes: [],
      edges: [],
    },
  });

  return NextResponse.json({ data: workflow }, { status: 201 });
}
