"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react"; // used for thinking spinner

interface Props {
  messages: UIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
        />
      ))}
      {/* Thinking dots — only shown before the first assistant part arrives */}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
          </div>
          <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
            <span className="inline-flex gap-1 text-white/30">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
