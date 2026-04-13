import { BaseNode } from "./BaseNode";
import { GitBranch } from "lucide-react";
import type { NodeProps } from "reactflow";

export function ConditionNode({ id, data }: NodeProps) {
  const expr = String(data.config?.expression ?? "");
  return (
    <BaseNode id={id} data={data} color="bg-orange-500/15 text-orange-400" icon={<GitBranch className="w-3.5 h-3.5" />} hasTrueOutput hasFalseOutput hasOutput={false}>
      <div className="space-y-1">
        {expr ? (
          <div className="font-mono text-[11px] text-white/40 truncate">{expr}</div>
        ) : (
          <span className="text-white/20">No condition set</span>
        )}
        <div className="flex justify-between text-[9px] mt-1">
          <span className="text-emerald-400/60">✓ true</span>
          <span className="text-red-400/60">✗ false</span>
        </div>
      </div>
    </BaseNode>
  );
}
