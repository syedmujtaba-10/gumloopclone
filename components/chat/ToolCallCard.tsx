"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  http_request: "🌐",
  sandbox_python: "🐍",
  sandbox_shell: "💻",
  sandbox_file: "📁",
};

const TOOL_LABELS: Record<string, string> = {
  web_search: "Searching the web",
  http_request: "Making HTTP request",
  sandbox_python: "Running Python",
  sandbox_shell: "Running shell command",
  sandbox_file: "Accessing file",
};

// AI SDK v6: part type is "tool-{name}", states are input-streaming / input-available / output-available
export interface ToolCallPart {
  type: string;           // e.g. "tool-web_search"
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error" | string;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
}

interface Props {
  part: ToolCallPart;
}

export function ToolCallCard({ part }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Extract tool name by stripping "tool-" prefix
  const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : part.type;
  const isRunning = part.state === "input-streaming" || part.state === "input-available";
  const isComplete = part.state === "output-available";
  const hasError = part.state === "output-error" || (isComplete && (part.output as { success?: boolean })?.success === false);

  const icon = TOOL_ICONS[toolName] ?? "🔧";
  const label = TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");

  return (
    <div
      className={cn(
        "rounded-lg border text-xs overflow-hidden transition-all duration-200",
        hasError
          ? "border-red-500/20 bg-red-500/5"
          : isComplete
          ? "border-emerald-500/15 bg-emerald-500/5"
          : "border-blue-500/20 bg-blue-500/5"
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className="text-sm leading-none">{icon}</span>
        <span className={cn(
          "flex-1 font-medium",
          hasError ? "text-red-400" : isComplete ? "text-emerald-400/80" : "text-blue-400"
        )}>
          {label}
          {toolName.startsWith("workflow_") && (
            <span className="ml-1 text-white/30">(workflow)</span>
          )}
        </span>
        {isRunning && <Loader2 className="w-3 h-3 animate-spin text-blue-400 flex-shrink-0" />}
        {isComplete && !hasError && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
        {hasError && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-white/20 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-2 space-y-2">
          {part.input && Object.keys(part.input).length > 0 && (
            <div>
              <p className="text-white/25 mb-1 uppercase tracking-wider text-[9px] font-semibold">Input</p>
              <pre className="text-white/45 overflow-x-auto text-[10px] leading-relaxed scrollbar-thin">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {isComplete && part.output !== undefined && (
            <div>
              <p className="text-white/25 mb-1 uppercase tracking-wider text-[9px] font-semibold">Output</p>
              <pre className="text-white/45 overflow-x-auto text-[10px] leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">
                {typeof part.output === "string"
                  ? part.output.slice(0, 500)
                  : JSON.stringify(part.output, null, 2).slice(0, 500)}
              </pre>
            </div>
          )}
          {hasError && part.errorText && (
            <p className="text-red-400/70 text-[10px]">{part.errorText}</p>
          )}
        </div>
      )}
    </div>
  );
}
