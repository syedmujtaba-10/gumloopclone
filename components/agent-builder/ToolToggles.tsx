"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Globe, Code2, Terminal, FolderOpen, Wrench } from "lucide-react";
import { ALL_TOOLS, type ToolName } from "@/types";

const ICONS: Record<string, React.ElementType> = {
  Search,
  Globe,
  Code2,
  Terminal,
  FolderOpen,
};

interface Props {
  enabledTools: string[];
  onChange: (tools: string[]) => void;
}

export function ToolToggles({ enabledTools, onChange }: Props) {
  function toggle(toolId: ToolName) {
    const current = new Set(enabledTools);
    if (current.has(toolId)) {
      current.delete(toolId);
    } else {
      current.add(toolId);
    }
    onChange(Array.from(current));
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-violet-400" />
        <Label className="text-white/70 font-medium">Tools</Label>
        <span className="text-xs text-white/25 ml-auto">
          {enabledTools.length} enabled
        </span>
      </div>

      <div className="space-y-2">
        {ALL_TOOLS.map((tool) => {
          const Icon = ICONS[tool.icon] ?? Globe;
          const enabled = enabledTools.includes(tool.id);

          return (
            <div
              key={tool.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                enabled
                  ? "bg-violet-500/8 border-violet-500/20"
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/10"
              }`}
              onClick={() => toggle(tool.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  enabled ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-white/30"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${enabled ? "text-white/85" : "text-white/50"}`}>
                    {tool.label}
                  </p>
                  <p className="text-xs text-white/30">{tool.description}</p>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={() => toggle(tool.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-violet-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
