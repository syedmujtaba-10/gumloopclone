"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ChevronLeft, Save } from "lucide-react";
import { AgentHeader } from "@/components/agent-builder/AgentHeader";
import { SystemPromptEditor } from "@/components/agent-builder/SystemPromptEditor";
import { ModelSelector } from "@/components/agent-builder/ModelSelector";
import { ParameterSliders } from "@/components/agent-builder/ParameterSliders";
import { ToolToggles } from "@/components/agent-builder/ToolToggles";
import { WorkflowToolToggles } from "@/components/agent-builder/WorkflowToolToggles";
import type { Agent } from "@/types";

type WorkflowOption = { id: string; name: string; emoji: string; description: string | null };

export default function AgentBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => r.json())
      .then(({ data, workflows: wf }) => {
        setAgent(data);
        setWorkflows(wf ?? []);
        setLoading(false);
        if (data?.name) document.title = `${data.emoji ?? ""} ${data.name} — Gumloop`;
      })
      .catch(() => { toast.error("Failed to load agent"); router.push("/agents"); });
    return () => { document.title = "Gumloop — AI Automation Platform"; };
  }, [id, router]);

  function updateAgent(patch: Partial<Agent>) {
    if (!agent) return;
    setAgent({ ...agent, ...patch });
  }

  const handleSave = useCallback(async () => {
    if (!agent) return;
    setSaving(true);
    const res = await fetch(`/api/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: agent.name,
        description: agent.description,
        emoji: agent.emoji,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        enabledTools: agent.enabledTools,
        workflowTools: agent.workflowTools,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Agent saved");
    } else {
      const body = await res.json().catch(() => ({}));
      console.error("[PUT /api/agents] error", body);
      toast.error("Failed to save agent");
    }
  }, [agent, id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/agents" className="text-white/30 hover:text-white/60 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/60">{agent.emoji} {agent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : "Save"}
          </Button>
          <Link href={`/agents/${id}/chat`}>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Open Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 space-y-6">
          <AgentHeader agent={agent} onUpdate={updateAgent} />
          <SystemPromptEditor value={agent.systemPrompt} onChange={(v) => updateAgent({ systemPrompt: v })} />
          <ModelSelector value={agent.model} onChange={(v) => updateAgent({ model: v })} />
          <ParameterSliders
            temperature={agent.temperature}
            maxTokens={agent.maxTokens}
            onTemperatureChange={(v) => updateAgent({ temperature: v })}
            onMaxTokensChange={(v) => updateAgent({ maxTokens: v })}
          />
          <ToolToggles
            enabledTools={agent.enabledTools}
            onChange={(v) => updateAgent({ enabledTools: v })}
          />
          <WorkflowToolToggles
            workflows={workflows}
            workflowTools={agent.workflowTools}
            onChange={(v) => updateAgent({ workflowTools: v })}
          />
        </div>
      </div>
    </div>
  );
}
