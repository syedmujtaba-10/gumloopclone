"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => Promise<void>;
  isLoading: boolean;
  agentId: string;
}

export function ChatInput({ onSend, isLoading }: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await onSend(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className={cn(
          "flex items-end gap-3 glass rounded-2xl px-4 py-3 border transition-all duration-200",
          input.trim() ? "border-violet-500/30" : "border-white/8"
        )}>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the agent… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 text-white/80 placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm min-h-0 py-0 px-0 leading-relaxed"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-8 w-8 p-0 flex-shrink-0 rounded-lg transition-all duration-200 border-0",
              input.trim() && !isLoading
                ? "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/20"
                : "bg-white/5 text-white/20"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-white/15 text-center mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
}
