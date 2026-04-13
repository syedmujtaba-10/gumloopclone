import { BaseNode } from "./BaseNode";
import { Globe } from "lucide-react";
import type { NodeProps } from "reactflow";

export function HTTPNode({ id, data }: NodeProps) {
  const method = String(data.config?.method ?? "GET");
  const url = String(data.config?.url ?? "");
  return (
    <BaseNode id={id} data={data} color="bg-blue-500/15 text-blue-400" icon={<Globe className="w-3.5 h-3.5" />}>
      <div className="space-y-0.5">
        <span className="font-mono text-blue-400/70 font-bold text-[10px]">{method}</span>
        {url && <div className="truncate text-white/30">{url.slice(0, 35)}{url.length > 35 ? "…" : ""}</div>}
      </div>
    </BaseNode>
  );
}
