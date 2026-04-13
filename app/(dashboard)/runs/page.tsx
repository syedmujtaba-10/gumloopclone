import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Run History — Gumloop" };
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Play, Webhook, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AllRunsPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user?.email
    ? await prisma.user.findUnique({ where: { email: user.email } })
    : null;

  const runs = dbUser
    ? await prisma.workflowRun.findMany({
        where: { workflow: { userId: dbUser.id } },
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { workflow: { select: { id: true, name: true, emoji: true } } },
      })
    : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white/90">Run History</h1>
        <p className="text-sm text-white/40 mt-0.5">{runs.length} recent runs across all workflows</p>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <History className="w-10 h-10 text-white/15" />
          <p className="text-white/40 text-sm">No workflow runs yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => {
            const duration = run.finishedAt
              ? Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)
              : null;

            const statusConfig = {
              success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
              error: "bg-red-500/15 text-red-400 border-red-500/25",
              running: "bg-blue-500/15 text-blue-400 border-blue-500/25",
              pending: "bg-white/10 text-white/40 border-white/15",
            }[run.status] ?? "bg-white/10 text-white/40 border-white/15";

            return (
              <Link key={run.id} href={`/workflows/${run.workflowId}/runs`}>
                <div className="glass-card px-4 py-3 flex items-center gap-4 hover:border-white/14 transition-all cursor-pointer">
                  <span className="text-lg flex-shrink-0">{run.workflow.emoji}</span>
                  <span className="text-sm text-white/70 flex-1 min-w-0 truncate font-medium">
                    {run.workflow.name}
                  </span>
                  <Badge variant="outline" className={cn("text-[10px] border flex-shrink-0", statusConfig)}>
                    {run.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-white/30 flex-shrink-0">
                    {run.trigger === "webhook" ? <Webhook className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {run.trigger}
                  </div>
                  {duration !== null && (
                    <span className="text-xs text-white/25 font-mono flex-shrink-0">{duration}s</span>
                  )}
                  <span className="text-xs text-white/25 flex-shrink-0">
                    {format(run.startedAt, "MMM d, h:mm a")}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
