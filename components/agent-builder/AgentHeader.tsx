"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Agent } from "@/types";

const EMOJI_OPTIONS = [
  "🤖", "⚡", "🧠", "🔍", "📊", "💡", "🛠️", "🚀", "🎯", "📝",
  "🌐", "🔗", "💬", "🔬", "📧", "📅", "🎨", "🏗️", "⚙️", "🧩",
];

interface Props {
  agent: Agent;
  onUpdate: (patch: Partial<Agent>) => void;
}

export function AgentHeader({ agent, onUpdate }: Props) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        {/* Emoji picker */}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger className="text-4xl w-14 h-14 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/14 flex items-center justify-center transition-all duration-200 flex-shrink-0">
            {agent.emoji}
          </PopoverTrigger>
          <PopoverContent className="w-auto glass border-white/10 bg-[#0f0f14] p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onUpdate({ emoji: e }); setEmojiOpen(false); }}
                  className={`w-9 h-9 rounded-lg text-xl transition-all duration-150 ${
                    agent.emoji === e
                      ? "bg-violet-500/25 scale-110"
                      : "hover:bg-white/8"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Name + description */}
        <div className="flex-1 space-y-2">
          <Input
            value={agent.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Agent name"
            className="bg-transparent border-transparent hover:border-white/10 focus:border-violet-500/50 text-white/90 font-medium text-lg h-auto py-1 px-2 -ml-2"
          />
          <Input
            value={agent.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value || null })}
            placeholder="Short description (optional)"
            className="bg-transparent border-transparent hover:border-white/10 focus:border-violet-500/50 text-white/45 text-sm h-auto py-1 px-2 -ml-2"
          />
        </div>
      </div>
    </div>
  );
}
