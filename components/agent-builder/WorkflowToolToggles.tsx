"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Workflow, Plug } from "lucide-react";

interface WorkflowOption {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}

interface Props {
  workflows: WorkflowOption[];
  workflowTools: string[];
  onChange: (ids: string[]) => void;
}

export function WorkflowToolToggles({ workflows, workflowTools, onChange }: Props) {
  function toggle(id: string) {
    const current = new Set(workflowTools);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange(Array.from(current));
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="w-4 h-4 text-violet-400" />
        <Label className="text-white/70 font-medium">Workflow Tools</Label>
        <span className="text-xs text-white/25 ml-auto">
          {workflowTools.length} enabled
        </span>
      </div>

      <p className="text-xs text-white/30">
        Allow this agent to call visual workflows as tools. The agent can trigger
        workflows during conversations to automate complex tasks.
      </p>

      {workflows.length === 0 ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
          <Workflow className="w-4 h-4 text-white/20" />
          <p className="text-sm text-white/30">
            No workflows yet.{" "}
            <a href="/workflows" className="text-violet-400 hover:text-violet-300 transition-colors">
              Create one
            </a>{" "}
            to enable it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf) => {
            const enabled = workflowTools.includes(wf.id);
            return (
              <div
                key={wf.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  enabled
                    ? "bg-blue-500/8 border-blue-500/20"
                    : "bg-white/[0.02] border-white/[0.05] hover:border-white/10"
                }`}
                onClick={() => toggle(wf.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{wf.emoji}</span>
                  <div>
                    <p className={`text-sm font-medium ${enabled ? "text-white/85" : "text-white/50"}`}>
                      {wf.name}
                    </p>
                    <p className="text-xs text-white/30">{wf.description ?? "No description"}</p>
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggle(wf.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
