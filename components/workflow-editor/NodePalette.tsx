"use client";

import { Zap, Brain, Globe, Code2, GitBranch, Flag } from "lucide-react";

const NODE_TYPES = [
  { type: "trigger", label: "Trigger", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { type: "llm", label: "AI / LLM", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { type: "http_request", label: "HTTP Request", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { type: "code", label: "Code", icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { type: "output", label: "Output", icon: Flag, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
];

interface Props {
  onAddNode: (type: string, label: string) => void;
}

export function NodePalette({ onAddNode }: Props) {
  return (
    <div className="glass-card p-3 space-y-1.5 w-40 mt-2 ml-2">
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-1 mb-2">
        Nodes
      </p>
      {NODE_TYPES.map(({ type, label, icon: Icon, color, bg }) => (
        <button
          key={type}
          onClick={() => onAddNode(type, label)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] ${bg}`}
        >
          <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
          <span className={`text-xs font-medium ${color}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}
