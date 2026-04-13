"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Workflow,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Copy,
  Play,
  Loader2,
  Webhook,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NewItemDialog } from "@/components/layout/NewItemDialog";
import { formatDistanceToNow } from "date-fns";

type WorkflowWithCount = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  webhookSecret: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { runs: number };
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const fetchWorkflows = useCallback(async () => {
    const res = await fetch("/api/workflows");
    const json = await res.json();
    setWorkflows(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  async function handleCreate(name: string, emoji: string) {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error("Failed to create workflow"); return; }
    toast.success("Workflow created");
    router.push(`/workflows/${json.data.id}`);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this workflow and all its run history?")) return;
    const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success("Workflow deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Workflows</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-violet-500/20 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white/80 placeholder:text-white/25 focus:border-violet-500/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center">
            <Workflow className="w-8 h-8 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white/50 font-medium mb-1">
              {search ? "No workflows found" : "No workflows yet"}
            </p>
            <p className="text-white/25 text-sm">
              {search ? "Try a different search term" : "Build your first visual automation"}
            </p>
          </div>
          {!search && (
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <div className="glass-card p-5 cursor-pointer group h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{wf.emoji}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="glass border-white/10 text-white/70 bg-[#111116]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                        onClick={(e) => handleDelete(wf.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-white/85 mb-0.5 truncate">{wf.name}</h3>
                  <p className="text-xs text-white/35 mb-3 line-clamp-2 min-h-[2rem]">
                    {wf.description ?? "No description"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    {wf.webhookSecret && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400/70 text-[10px] gap-1 py-0">
                        <Webhook className="w-2.5 h-2.5" /> webhook
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/25">
                    <Play className="w-3 h-3" />
                    {wf._count.runs} run{wf._count.runs !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        title="New Workflow"
        placeholder="Email Summarizer"
        defaultEmoji="⚡"
      />
    </div>
  );
}
