"use client";

import { Sparkles } from "lucide-react";

interface Props {
  suggestions: string[];
  onSelect: (s: string) => void;
}

export function FollowUpSuggestions({ suggestions, onSelect }: Props) {
  return (
    <div className="px-4 pb-3 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 text-violet-400/60" />
        <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="text-xs px-3 py-1.5 rounded-full glass border border-white/8 hover:border-violet-500/30 text-white/50 hover:text-white/70 transition-all duration-200 hover:bg-violet-500/8"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
