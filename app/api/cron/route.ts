import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300; // 5 min — allow time for multiple workflows

/**
 * GET /api/cron
 * Called by Vercel Cron every minute. Finds all scheduled workflows whose
 * nextRunAt is in the past and executes them, then advances nextRunAt.
 *
 * Protected by Authorization: Bearer <CRON_SECRET> header (set automatically by Vercel Cron).
 */
export async function GET(req: NextRequest) {
  // Validate cron secret (Vercel sets this automatically; skip check if not configured locally)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Find all workflows with a due schedule
  const dueWorkflows = await prisma.workflow.findMany({
    where: {
      cronExpression: { not: null },
      nextRunAt: { lte: now },
    },
    select: { id: true, name: true, cronExpression: true },
  });

  if (dueWorkflows.length === 0) {
    return NextResponse.json({ ran: 0 });
  }

  console.log(`[GET /api/cron] ${dueWorkflows.length} workflow(s) due`);

  const { executeWorkflow } = await import("@/lib/workflow/executor");
  const { Cron } = await import("croner");

  const results: Array<{ id: string; name: string; status: string }> = [];

  for (const wf of dueWorkflows) {
    const runId = crypto.randomUUID();
    try {
      await executeWorkflow(wf.id, { input: "" }, runId);

      // Advance nextRunAt to the next occurrence after now
      const next = new Cron(wf.cronExpression!).nextRun() ?? null;
      await prisma.workflow.update({
        where: { id: wf.id },
        data: { nextRunAt: next },
      });

      console.log(`[GET /api/cron] workflowId=${wf.id} name="${wf.name}" runId=${runId} nextRunAt=${next?.toISOString()}`);
      results.push({ id: wf.id, name: wf.name, status: "ok" });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[GET /api/cron] workflowId=${wf.id} name="${wf.name}" error="${error}"`);

      // Still advance nextRunAt so we don't retry every minute on a broken workflow
      try {
        const next = new Cron(wf.cronExpression!).nextRun() ?? null;
        await prisma.workflow.update({ where: { id: wf.id }, data: { nextRunAt: next } });
      } catch { /* ignore */ }

      results.push({ id: wf.id, name: wf.name, status: `error: ${error}` });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
