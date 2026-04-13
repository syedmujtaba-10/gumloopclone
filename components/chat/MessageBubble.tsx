"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolCallCard, getToolMeta, type ToolCallPart } from "./ToolCallCard";
import { CopyButton } from "./CopyButton";
import { User, Bot, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message: UIMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const [toolsExpanded, setToolsExpanded] = useState(true);

  // Extract text content from parts
  const textContent = message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("") ?? "";

  // In AI SDK v6, tool parts have type "tool-{name}" or "dynamic-tool"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolParts = (message.parts ?? []).filter(
    (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
  ) as unknown as ToolCallPart[];

  const hasTools = toolParts.length > 0;
  const runningCount = toolParts.filter(
    (p) => p.state === "input-streaming" || p.state === "input-available"
  ).length;
  const completedCount = toolParts.filter((p) => p.state === "output-available").length;

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser
            ? "bg-violet-500/25 border border-violet-500/30"
            : "bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/20"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-violet-300" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-violet-300" />
        )}
      </div>

      <div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
        {/* Tool calls — collapsible Gumloop-style section */}
        {hasTools && (
          <div className="w-full glass rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Header — show one icon chip per unique tool used */}
            <button
              onClick={() => setToolsExpanded((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
            >
              {/* Deduplicated tool icon chips */}
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from(new Set(toolParts.map((p) => p.type.startsWith("tool-") ? p.type.slice(5) : p.type))).map((name) => {
                  const meta = getToolMeta(name);
                  const Icon = meta.icon;
                  return (
                    <div key={name} className={cn("w-5 h-5 rounded-md flex items-center justify-center", meta.bg)}>
                      <Icon className={cn("w-3 h-3", meta.color)} />
                    </div>
                  );
                })}
              </div>
              <span className="text-xs text-white/40 flex-1">
                {runningCount > 0
                  ? `Using ${runningCount} tool${runningCount > 1 ? "s" : ""}…`
                  : `${completedCount} tool call${completedCount !== 1 ? "s" : ""}`}
              </span>
              {toolsExpanded ? (
                <ChevronDown className="w-3 h-3 text-white/20" />
              ) : (
                <ChevronRight className="w-3 h-3 text-white/15" />
              )}
            </button>

            {/* Tool list */}
            {toolsExpanded && (
              <div className="border-t border-white/[0.06] px-2 py-2 space-y-1.5">
                {toolParts.map((part, i) => (
                  <ToolCallCard key={part.toolCallId ?? i} part={part} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message text */}
        {textContent && (
          <div className="group relative w-full">
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                isUser
                  ? "bg-violet-500/15 border border-violet-500/20 text-white/85 rounded-tr-sm"
                  : "glass-card text-white/80 rounded-tl-sm",
                isStreaming && !hasTools && "streaming-cursor"
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{textContent}</p>
              ) : (
                <MarkdownRenderer content={textContent} />
              )}
            </div>
            {!isStreaming && <CopyButton text={textContent} />}
          </div>
        )}

        {/* Streaming pulse when no text yet but tools are running */}
        {isStreaming && !textContent && !hasTools && (
          <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
            <span className="inline-flex gap-1 text-white/30">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
