"use client";

import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  id: string;
  data: {
    label: string;
    status?: "idle" | "running" | "success" | "error";
  };
  color: string;
  icon: ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  hasTrueOutput?: boolean;
  hasFalseOutput?: boolean;
  children?: ReactNode;
}

const STATUS_CLASSES = {
  idle: "",
  running: "node-running",
  success: "node-success",
  error: "node-error",
};

export function BaseNode({
  data,
  color,
  icon,
  hasInput = true,
  hasOutput = true,
  hasTrueOutput = false,
  hasFalseOutput = false,
  children,
}: Props) {
  const status = data.status ?? "idle";

  return (
    <div
      className={cn(
        "relative glass-card min-w-[180px] max-w-[240px] transition-all duration-200 overflow-visible",
        STATUS_CLASSES[status]
      )}
    >
      {/* Input handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !border-2 !border-white/20 !bg-[#0a0a0f] !rounded-full hover:!border-violet-400 transition-colors"
        />
      )}

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]`}>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-white/75 truncate flex-1">{data.label}</span>
        {status !== "idle" && (
          <div className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            status === "running" ? "bg-blue-400 animate-pulse" :
            status === "success" ? "bg-emerald-400" : "bg-red-400"
          )} />
        )}
      </div>

      {/* Content */}
      {children && (
        <div className="px-3 py-2 text-xs text-white/35">{children}</div>
      )}

      {/* Output handle */}
      {hasOutput && !hasTrueOutput && !hasFalseOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white/20 !bg-[#0a0a0f] !rounded-full hover:!border-violet-400 transition-colors"
        />
      )}

      {/* Condition outputs */}
      {hasTrueOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: "30%" }}
          className="!w-3 !h-3 !border-2 !border-emerald-500/40 !bg-[#0a0a0f] !rounded-full"
        />
      )}
      {hasFalseOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: "70%" }}
          className="!w-3 !h-3 !border-2 !border-red-500/40 !bg-[#0a0a0f] !rounded-full"
        />
      )}
    </div>
  );
}
