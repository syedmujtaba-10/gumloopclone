"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  temperature: number;
  maxTokens: number;
  onTemperatureChange: (v: number) => void;
  onMaxTokensChange: (v: number) => void;
}

export function ParameterSliders({
  temperature,
  maxTokens,
  onTemperatureChange,
  onMaxTokensChange,
}: Props) {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-violet-400" />
        <Label className="text-white/70 font-medium">Parameters</Label>
      </div>

      {/* Temperature */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-white/70">Temperature</p>
            <p className="text-xs text-white/30">
              {temperature < 0.3 ? "More focused" : temperature > 0.7 ? "More creative" : "Balanced"}
            </p>
          </div>
          <span className="text-sm font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
            {temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(v) => onTemperatureChange(Array.isArray(v) ? v[0] : v)}
          min={0}
          max={1}
          step={0.1}
          className="[&_[role=slider]]:bg-violet-400 [&_[role=slider]]:border-violet-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-violet-500/30"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-white/70">Max Tokens</p>
            <p className="text-xs text-white/30">Maximum response length</p>
          </div>
          <span className="text-sm font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
            {maxTokens.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[maxTokens]}
          onValueChange={(v) => onMaxTokensChange(Array.isArray(v) ? v[0] : v)}
          min={256}
          max={8192}
          step={256}
          className="[&_[role=slider]]:bg-violet-400 [&_[role=slider]]:border-violet-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-violet-500/30"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>256</span>
          <span>8,192</span>
        </div>
      </div>
    </div>
  );
}
