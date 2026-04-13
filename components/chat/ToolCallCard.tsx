"use client";

import { useState } from "react";
import {
  Search, Globe, Globe2, Code2, Terminal, FolderOpen,
  Workflow, Wrench, CheckCircle2, XCircle, Loader2,
  ChevronDown, ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolMeta {
  icon: LucideIcon;
  label: string;
  color: string;       // text color
  bg: string;          // icon background
  border: string;      // card border when running
}

const TOOL_META: Record<string, ToolMeta> = {
  web_search:    { icon: Search,     label: "Searching the web",       color: "text-violet-400",  bg: "bg-violet-500/15",   border: "border-violet-500/20" },
  web_scrape:    { icon: Globe2,     label: "Scraping URL",            color: "text-teal-400",    bg: "bg-teal-500/15",     border: "border-teal-500/20"   },
  http_request:  { icon: Globe,      label: "HTTP request",            color: "text-blue-400",    bg: "bg-blue-500/15",     border: "border-blue-500/20"   },
  sandbox_python:{ icon: Code2,      label: "Running Python",          color: "text-emerald-400", bg: "bg-emerald-500/15",  border: "border-emerald-500/20"},
  sandbox_shell: { icon: Terminal,   label: "Running shell command",   color: "text-orange-400",  bg: "bg-orange-500/15",   border: "border-orange-500/20" },
  sandbox_file:  { icon: FolderOpen, label: "Accessing file",          color: "text-amber-400",   bg: "bg-amber-500/15",    border: "border-amber-500/20"  },
};

function getToolMeta(toolName: string): ToolMeta {
  if (TOOL_META[toolName]) return TOOL_META[toolName];
  if (toolName.startsWith("workflow_")) {
    return { icon: Workflow, label: toolName.replace(/^workflow_/, "").replace(/_/g, " "), color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/20" };
  }
  return { icon: Wrench, label: toolName.replace(/_/g, " "), color: "text-white/50", bg: "bg-white/[0.06]", border: "border-white/[0.08]" };
}

// AI SDK v6: part type is "tool-{name}", states are input-streaming / input-available / output-available
export interface ToolCallPart {
  type: string;
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

  const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : part.type;
  const isRunning = part.state === "input-streaming" || part.state === "input-available";
  const isComplete = part.state === "output-available";
  const hasError = part.state === "output-error" || (isComplete && (part.output as { success?: boolean })?.success === false);

  const meta = getToolMeta(toolName);
  const Icon = meta.icon;

  const borderClass = hasError
    ? "border-red-500/20 bg-red-500/5"
    : isComplete
    ? "border-white/[0.07] bg-white/[0.03]"
    : `${meta.border} bg-white/[0.02]`;

  return (
    <div className={cn("rounded-lg border text-xs overflow-hidden transition-all duration-200", borderClass)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
      >
        {/* Tool icon chip */}
        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", meta.bg)}>
          <Icon className={cn("w-3 h-3", hasError ? "text-red-400" : meta.color)} />
        </div>

        <span className={cn(
          "flex-1 font-medium capitalize",
          hasError ? "text-red-400/80" : isComplete ? "text-white/55" : meta.color
        )}>
          {meta.label}
          {toolName.startsWith("workflow_") && (
            <span className="ml-1 text-white/25 font-normal text-[10px]">workflow</span>
          )}
        </span>

        {/* Status */}
        {isRunning && <Loader2 className="w-3 h-3 animate-spin text-blue-400/70 flex-shrink-0" />}
        {isComplete && !hasError && <CheckCircle2 className="w-3 h-3 text-emerald-400/60 flex-shrink-0" />}
        {hasError && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}

        {expanded
          ? <ChevronDown className="w-3 h-3 text-white/20 flex-shrink-0" />
          : <ChevronRight className="w-3 h-3 text-white/15 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.05] px-3 py-2 space-y-2">
          {part.input && Object.keys(part.input).length > 0 && (
            <div>
              <p className="text-white/20 mb-1 uppercase tracking-wider text-[9px] font-semibold">Input</p>
              <pre className="text-white/40 overflow-x-auto text-[10px] leading-relaxed scrollbar-thin">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {isComplete && part.output !== undefined && (
            <div>
              <p className="text-white/20 mb-1 uppercase tracking-wider text-[9px] font-semibold">Output</p>
              <pre className="text-white/40 overflow-x-auto text-[10px] leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">
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

// Export so MessageBubble can show icons in the collapsed header
export { getToolMeta, TOOL_META };
