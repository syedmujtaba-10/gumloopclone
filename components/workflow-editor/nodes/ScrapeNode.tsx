import { BaseNode } from "./BaseNode";
import { Globe2 } from "lucide-react";
import type { NodeProps } from "reactflow";

export function ScrapeNode({ id, data }: NodeProps) {
  const url = String(data.config?.url ?? "");
  const format = String(data.config?.format ?? "markdown");
  return (
    <BaseNode id={id} data={data} color="bg-teal-500/15 text-teal-400" icon={<Globe2 className="w-3.5 h-3.5" />}>
      <div className="space-y-0.5">
        <span className="font-mono text-teal-400/70 font-bold text-[10px] uppercase">{format}</span>
        {url && <div className="truncate text-white/30">{url.slice(0, 35)}{url.length > 35 ? "…" : ""}</div>}
      </div>
    </BaseNode>
  );
}
