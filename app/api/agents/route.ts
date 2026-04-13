import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { upsertUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  emoji: z.string().optional(),
});

// GET /api/agents — list user's agents
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser) return NextResponse.json({ data: [] });

  console.log(`[GET /api/agents] userId=${dbUser.id}`);

  const agents = await prisma.agent.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { conversations: true } } },
  });

  return NextResponse.json({ data: agents });
}

// POST /api/agents — create agent
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await upsertUser(user);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = CreateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  console.log(`[POST /api/agents] userId=${dbUser.id} name="${parsed.data.name}"`);

  const agent = await prisma.agent.create({
    data: {
      userId: dbUser.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      emoji: parsed.data.emoji ?? "🤖",
    },
  });

  return NextResponse.json({ data: agent }, { status: 201 });
}
