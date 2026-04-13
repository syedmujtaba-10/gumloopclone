"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Copy,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewItemDialog } from "@/components/layout/NewItemDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent } from "@/types";
import { formatDistanceToNow } from "date-fns";

type AgentWithCount = Agent & { _count: { conversations: number } };

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Agents — Gumloop";
    return () => { document.title = "Gumloop — AI Automation Platform"; };
  }, []);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    const json = await res.json();
    setAgents(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleCreate(name: string, emoji: string) {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error("Failed to create agent"); return; }
    toast.success("Agent created");
    router.push(`/agents/${json.data.id}`);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this agent? All conversations will be lost.")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agent deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleDuplicate(agent: AgentWithCount, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${agent.name} (copy)`, emoji: agent.emoji }),
    });
    if (!res.ok) { toast.error("Failed to duplicate"); return; }
    const json = await res.json();
    // Copy config over
    await fetch(`/api/agents/${json.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        enabledTools: agent.enabledTools,
        workflowTools: agent.workflowTools,
      }),
    });
    toast.success("Agent duplicated");
    fetchAgents();
  }

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Agents</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-violet-500/20 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white/80 placeholder:text-white/25 focus:border-violet-500/50"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <Skeleton className="w-9 h-9 rounded-md" />
                <Skeleton className="w-6 h-6 rounded" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white/50 font-medium mb-1">
              {search ? "No agents found" : "No agents yet"}
            </p>
            <p className="text-white/25 text-sm">
              {search ? "Try a different search term" : "Create your first AI agent"}
            </p>
          </div>
          {!search && (
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create agent
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <div className="glass-card p-5 cursor-pointer group h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{agent.emoji}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="text-white/70"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="gap-2 hover:text-white cursor-pointer"
                        onClick={(e) => handleDuplicate(agent, e)}
                      >
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                        onClick={(e) => handleDelete(agent.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-white/85 mb-0.5 truncate">{agent.name}</h3>
                  <p className="text-xs text-white/35 mb-3 line-clamp-2 min-h-[2rem]">
                    {agent.description ?? agent.systemPrompt.slice(0, 80) + "…"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-xs text-white/30 font-mono">{agent.model.replace("claude-", "").replace("gpt-", "")}</span>
                  <div className="flex items-center gap-1 text-xs text-white/25">
                    <MessageSquare className="w-3 h-3" />
                    {agent._count.conversations}
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
        title="New Agent"
        placeholder="My Research Agent"
        defaultEmoji="🤖"
      />
    </div>
  );
}
