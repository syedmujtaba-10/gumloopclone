import { BaseNode } from "./BaseNode";
import { Zap } from "lucide-react";
import type { NodeProps } from "reactflow";

export function TriggerNode({ id, data }: NodeProps) {
  const triggerType = data.config?.triggerType ?? "manual";
  return (
    <BaseNode id={id} data={data} color="bg-amber-500/15 text-amber-400" icon={<Zap className="w-3.5 h-3.5" />} hasInput={false}>
      <span className="capitalize">{triggerType === "webhook" ? "🔗 Webhook" : "▶ Manual"}</span>
    </BaseNode>
  );
}
