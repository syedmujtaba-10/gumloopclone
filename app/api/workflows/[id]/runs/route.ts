import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/workflows/[id]/runs
export async function GET(
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

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = 20;

  const [runs, total] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflowId: id },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workflowRun.count({ where: { workflowId: id } }),
  ]);

  return NextResponse.json({ data: runs, total, page, pageSize });
}
