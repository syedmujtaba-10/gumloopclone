"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const MAX_CHARS = 10000;

export function SystemPromptEditor({ value, onChange }: Props) {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <Label className="text-white/70 font-medium">System Prompt</Label>
        </div>
        <span className={`text-xs font-mono ${value.length > MAX_CHARS * 0.9 ? "text-amber-400/70" : "text-white/25"}`}>
          {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="You are a helpful AI assistant. You have access to various tools to help users accomplish their goals..."
        rows={8}
        maxLength={MAX_CHARS}
        className="bg-white/4 border-white/8 text-white/80 placeholder:text-white/20 focus:border-violet-500/40 resize-y font-mono text-sm leading-relaxed"
      />

      <p className="text-xs text-white/25">
        Define the agent's persona, capabilities, and instructions. Markdown supported.
      </p>
    </div>
  );
}
