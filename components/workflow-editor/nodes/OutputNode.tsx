import { BaseNode } from "./BaseNode";
import { Flag } from "lucide-react";
import type { NodeProps } from "reactflow";

export function OutputNode({ id, data }: NodeProps) {
  const outputLabel = String(data.config?.label ?? "Output");
  const format = String(data.config?.format ?? "text");

  return (
    <BaseNode id={id} data={data} color="bg-pink-500/15 text-pink-400" icon={<Flag className="w-3.5 h-3.5" />} hasOutput={false}>
      <span className="text-pink-400/60 font-mono truncate">{outputLabel}</span>
      <span className="text-white/25 truncate">{format}</span>
    </BaseNode>
  );
}
