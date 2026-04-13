"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Play, Copy, Webhook, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import Link from "next/link";
import type { Workflow } from "@/types";
import type { Node, Edge } from "reactflow";

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, "running" | "success" | "error">>({});
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, unknown>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-current nodes/edges for Cmd+S (canvas manages its own state)
  const latestNodesRef = useRef<Node[]>([]);
  const latestEdgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    fetch(`/api/workflows/${id}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setWorkflow(data);
        setLoading(false);
        if (data?.name) document.title = `${data.emoji ?? ""} ${data.name} — Gumloop`;
      })
      .catch(() => { toast.error("Failed to load workflow"); router.push("/workflows"); });
    return () => { document.title = "Gumloop — AI Automation Platform"; };
  }, [id, router]);

  const saveNodes = useCallback((nodes: Node[], edges: Edge[]) => {
    // Keep refs current so Cmd+S always saves the latest canvas state
    latestNodesRef.current = nodes;
    latestEdgesRef.current = edges;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaved(false);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      setSaving(false);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }, 1000);
  }, [id]);

  const handleSave = useCallback(async () => {
    const nodes = latestNodesRef.current;
    const edges = latestEdgesRef.current;
    if (!nodes.length && !edges.length) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    const res = await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  async function handleRun() {
    setRunning(true);
    setNodeStatuses({});
    setNodeOutputs({});

    const res = await fetch(`/api/workflows/${id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: {} }),
    });

    if (!res.body) { setRunning(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.nodeId) {
            setNodeStatuses((prev) => ({
              ...prev,
              [event.nodeId]: event.type === "node_complete" ? "success"
                : event.type === "node_error" ? "error"
                : "running",
            }));
            if (event.type === "node_complete" && event.output !== undefined) {
              setNodeOutputs((prev) => ({ ...prev, [event.nodeId]: event.output }));
            }
          }
          if (event.type === "workflow_complete") {
            toast.success("Workflow completed successfully");
            setRunning(false);
          }
          if (event.type === "workflow_error") {
            toast.error(`Workflow failed: ${event.error}`);
            setRunning(false);
          }
        } catch { /* skip malformed */ }
      }
    }
    setRunning(false);
  }

  function copyWebhookUrl() {
    if (!workflow?.webhookSecret) return;
    const url = `${window.location.origin}/api/webhooks/${workflow.webhookSecret}`;
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!workflow) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/workflows" className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/60 truncate">
            {workflow.emoji} {workflow.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && (
            <span className="text-xs text-white/25 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {saved && !saving && (
            <span className="text-xs text-emerald-400/60 flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Saved
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={copyWebhookUrl}
            className="border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 gap-1.5 h-8 text-xs"
          >
            <Webhook className="w-3 h-3" />
            Webhook
          </Button>
          <Link href={`/workflows/${id}/runs`}>
            <Button size="sm" variant="outline" className="border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 h-8 text-xs">
              History
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 gap-2 h-8"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running…" : "Run"}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas
          initialNodes={workflow.nodes as unknown as Node[]}
          initialEdges={workflow.edges as unknown as Edge[]}
          nodeStatuses={nodeStatuses}
          nodeOutputs={nodeOutputs}
          onNodesEdgesChange={saveNodes}
          isRunning={running}
        />
      </div>
    </div>
  );
}
