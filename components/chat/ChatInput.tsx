"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_BYTES = 4 * 1024 * 1024;   // 4 MB per file
const MAX_TOTAL_BYTES = 7 * 1024 * 1024;  // 7 MB total (base64 adds ~33% overhead → stays under 10 MB)

interface Props {
  onSend: (text: string, files?: File[]) => Promise<void>;
  isLoading: boolean;
  agentId: string;
}

export function ChatInput({ onSend, isLoading }: Props) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && files.length === 0) || isLoading) return;
    const pendingFiles = [...files];
    setInput("");
    setFiles([]);
    await onSend(text, pendingFiles.length > 0 ? pendingFiles : undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const toAdd: File[] = [];

    for (const f of selected) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`"${f.name}" is too large (max 4 MB per file)`);
        continue;
      }
      toAdd.push(f);
    }

    const newList = [...files, ...toAdd];
    const totalBytes = newList.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      toast.error("Total attachment size exceeds 7 MB — remove some files");
      e.target.value = "";
      return;
    }

    setFiles(newList);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const canSend = (input.trim() || files.length > 0) && !isLoading;

  return (
    <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Attached file chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-[11px] text-white/60">
                <Paperclip className="w-3 h-3 text-white/30" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-white/25 hover:text-white/60 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={cn(
          "flex items-end gap-3 glass rounded-2xl px-4 py-3 border transition-all duration-200",
          canSend ? "border-violet-500/30" : "border-white/8"
        )}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.md,.csv"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-all flex-shrink-0 relative",
              isLoading ? "text-white/15" : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <Paperclip className="w-4 h-4" />
            {files.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {files.length}
              </span>
            )}
          </button>

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
            disabled={!canSend}
            className={cn(
              "h-8 w-8 p-0 flex-shrink-0 rounded-lg transition-all duration-200 border-0",
              canSend
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
