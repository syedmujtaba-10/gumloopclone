"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Loader2, Play, Webhook, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface Run {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  output: unknown;
  input?: unknown;
  nodeResults: Array<{ nodeId: string; nodeType: string; durationMs: number; output: unknown; error: string | null }> | null;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    success: { label: "Success", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    error: { label: "Error", class: "bg-red-500/15 text-red-400 border-red-500/25" },
    running: { label: "Running", class: "bg-blue-500/15 text-blue-400 border-blue-500/25 animate-pulse" },
    pending: { label: "Pending", class: "bg-white/10 text-white/40 border-white/15" },
  }[status] ?? { label: status, class: "bg-white/10 text-white/40 border-white/15" };

  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium border", config.class)}>
      {config.label}
    </Badge>
  );
}

export default function WorkflowRunsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  async function handleRerun(run: Run, e: React.MouseEvent) {
    e.stopPropagation();
    setRerunningId(run.id);
    try {
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: (run as Run & { input?: unknown }).input ?? {} }),
      });
      if (!res.ok) throw new Error("Failed to re-run");
      toast.success("Re-run started — watch it live in the editor");
      router.push(`/workflows/${id}`);
    } catch {
      toast.error("Failed to re-run workflow");
    } finally {
      setRerunningId(null);
    }
  }

  useEffect(() => {
    fetch(`/api/workflows/${id}/runs`)
      .then((r) => r.json())
      .then(({ data }) => { setRuns(data ?? []); setLoading(false); });
  }, [id]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/workflows/${id}`} className="text-white/30 hover:text-white/60 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Run History</h1>
          <p className="text-sm text-white/40 mt-0.5">{runs.length} total run{runs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Clock className="w-10 h-10 text-white/15" />
          <p className="text-white/40 text-sm">No runs yet. Hit "Run" in the editor to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => {
            const duration = run.finishedAt
              ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
              : null;
            const expanded = expandedRun === run.id;

            return (
              <div key={run.id} className="glass-card overflow-hidden">
                {/* Run header — div instead of button to allow nested button (Re-run) */}
                <div
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setExpandedRun(expanded ? null : run.id)}
                >
                  <StatusBadge status={run.status} />
                  <div className="flex items-center gap-1.5 text-xs text-white/35">
                    {run.trigger === "webhook" ? <Webhook className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {run.trigger}
                  </div>
                  <span className="text-xs text-white/40 flex-1">
                    {format(new Date(run.startedAt), "MMM d, h:mm a")}
                  </span>
                  {duration !== null && (
                    <span className="text-xs text-white/25 font-mono">
                      {duration}s
                    </span>
                  )}
                  {run.error && (
                    <span className="text-xs text-red-400/70 truncate max-w-48">{run.error}</span>
                  )}
                  {run.status !== "running" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-white/30 hover:text-white/70 hover:bg-white/5 gap-1 text-[11px]"
                      onClick={(e) => handleRerun(run, e)}
                      disabled={rerunningId === run.id}
                    >
                      {rerunningId === run.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RotateCcw className="w-3 h-3" />}
                      Re-run
                    </Button>
                  )}
                  <ChevronLeft className={cn("w-3.5 h-3.5 text-white/20 transition-transform", expanded && "rotate-90")} />
                </div>

                {/* Expanded: node results */}
                {expanded && run.nodeResults && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Node Results</p>
                    {run.nodeResults.map((nr, i) => (
                      <div key={i} className={cn(
                        "rounded-lg border p-3 text-xs",
                        nr.error ? "border-red-500/15 bg-red-500/5" : "border-emerald-500/15 bg-emerald-500/5"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-mono font-medium", nr.error ? "text-red-400" : "text-emerald-400")}>
                            {nr.nodeType} · {nr.nodeId}
                          </span>
                          <span className="text-white/25 font-mono">{nr.durationMs}ms</span>
                        </div>
                        {nr.error ? (
                          <p className="text-red-400/70">{nr.error}</p>
                        ) : (
                          <pre className="text-white/40 overflow-x-auto max-h-24 scrollbar-thin text-[10px]">
                            {JSON.stringify(nr.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
