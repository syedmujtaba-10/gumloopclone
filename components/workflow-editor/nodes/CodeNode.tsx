import { BaseNode } from "./BaseNode";
import { Code2 } from "lucide-react";
import type { NodeProps } from "reactflow";

export function CodeNode({ id, data }: NodeProps) {
  const code = String(data.config?.code ?? "");
  const lines = code.split("\n").length;
  return (
    <BaseNode id={id} data={data} color="bg-emerald-500/15 text-emerald-400" icon={<Code2 className="w-3.5 h-3.5" />}>
      {code ? <span>{lines} line{lines !== 1 ? "s" : ""} of Python</span> : <span className="text-white/20">No code yet</span>}
    </BaseNode>
  );
}
