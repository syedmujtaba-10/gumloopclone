"use client";

import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Cpu } from "lucide-react";
import { MODEL_OPTIONS } from "@/types";

interface Props {
  value: string;
  onChange: (model: string) => void;
}

function getModelLabel(id: string): string {
  for (const group of MODEL_OPTIONS) {
    const m = group.models.find((m) => m.id === id);
    if (m) return m.label;
  }
  return id;
}

function getProviderColor(id: string) {
  return id.startsWith("claude") ? "text-amber-400/80" : "text-emerald-400/80";
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-violet-400" />
        <Label className="text-white/70 font-medium">Model</Label>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-between bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/14 text-white/80 h-10 rounded-md px-3 text-sm transition-colors">
          <span className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${getProviderColor(value)}`}>
              {value.startsWith("claude") ? "Anthropic" : "OpenAI"}
            </span>
            <span>{getModelLabel(value)}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-white/30" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 glass border-white/10 bg-[#0f0f14]">
          {MODEL_OPTIONS.map((group, i) => (
            <DropdownMenuGroup key={group.group}>
              {i > 0 && <DropdownMenuSeparator className="bg-white/6" />}
              <DropdownMenuLabel className="text-white/35 text-xs font-semibold uppercase tracking-wider">
                {group.group}
              </DropdownMenuLabel>
              {group.models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onChange(model.id)}
                  className={`cursor-pointer text-white/70 hover:text-white hover:bg-white/5 ${
                    value === model.id ? "bg-violet-500/10 text-white/90" : ""
                  }`}
                >
                  {model.label}
                  {value === model.id && (
                    <span className="ml-auto text-violet-400">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
