import { BaseNode } from "./BaseNode";
import { Brain } from "lucide-react";
import type { NodeProps } from "reactflow";

export function LLMNode({ id, data }: NodeProps) {
  const model = String(data.config?.model ?? "claude-haiku-4-5");
  const prompt = String(data.config?.prompt ?? "");
  return (
    <BaseNode id={id} data={data} color="bg-violet-500/15 text-violet-400" icon={<Brain className="w-3.5 h-3.5" />}>
      <div className="space-y-0.5">
        <div className="font-mono text-violet-400/60">{model.replace("claude-", "").replace("gpt-", "")}</div>
        {prompt && <div className="truncate text-white/30">{prompt.slice(0, 40)}{prompt.length > 40 ? "…" : ""}</div>}
      </div>
    </BaseNode>
  );
}
