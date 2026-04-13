"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const EMOJI_OPTIONS = ["🤖", "⚡", "🧠", "🔍", "📊", "💡", "🛠️", "🚀", "🎯", "📝", "🌐", "🔗"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, emoji: string) => Promise<void>;
  title: string;
  placeholder?: string;
  defaultEmoji?: string;
}

export function NewItemDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  placeholder = "Name",
  defaultEmoji = "🤖",
}: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(defaultEmoji);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit(name.trim(), emoji);
    setLoading(false);
    setName("");
    setEmoji(defaultEmoji);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-[#0f0f14] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white/90">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Emoji picker */}
          <div className="space-y-2">
            <Label className="text-white/50 text-xs uppercase tracking-wider">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg transition-all duration-150 ${
                    emoji === e
                      ? "bg-violet-500/25 ring-1 ring-violet-400/60 scale-105"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <Label htmlFor="item-name" className="text-white/50 text-xs uppercase tracking-wider">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus:border-violet-500/50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/40 hover:text-white/70"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
