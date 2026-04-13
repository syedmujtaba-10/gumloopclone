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
import type { WorkflowTemplate } from "@/lib/workflow-templates";

const EMOJI_OPTIONS = ["🤖", "⚡", "🧠", "🔍", "📊", "💡", "🛠️", "🚀", "🎯", "📝", "🌐", "🔗"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, emoji: string, templateId?: string) => Promise<void>;
  title: string;
  placeholder?: string;
  defaultEmoji?: string;
  templates?: WorkflowTemplate[];
}

export function NewItemDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  placeholder = "Name",
  defaultEmoji = "🤖",
  templates,
}: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(defaultEmoji);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"blank" | "template">("blank");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  function reset() {
    setName("");
    setEmoji(defaultEmoji);
    setTab("blank");
    setSelectedTemplate(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit(name.trim(), emoji, selectedTemplate?.id);
    setLoading(false);
    reset();
    onOpenChange(false);
  }

  function pickTemplate(t: WorkflowTemplate) {
    setSelectedTemplate(t);
    setName(t.name);
    setEmoji(t.emoji);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="glass border-white/10 bg-[#0f0f14] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white/90">{title}</DialogTitle>
        </DialogHeader>

        {/* Tab switcher — only shown when templates are provided */}
        {templates && templates.length > 0 && (
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-1">
            {(["blank", "template"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setSelectedTemplate(null); setName(""); setEmoji(defaultEmoji); }}
                className={`flex-1 text-xs py-1.5 rounded-md capitalize font-medium transition-all ${
                  tab === t
                    ? "bg-violet-600 text-white shadow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "blank" ? "Blank" : "From Template"}
              </button>
            ))}
          </div>
        )}

        {tab === "template" && templates ? (
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  selectedTemplate?.id === t.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-sm font-medium text-white/80">{t.name}</span>
                </div>
                <p className="text-[11px] text-white/35 leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>
        ) : null}

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
              onClick={() => { reset(); onOpenChange(false); }}
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
