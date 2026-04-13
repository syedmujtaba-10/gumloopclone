"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface Props {
  agentId: string;
  activeConversationId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationSidebar({ agentId, activeConversationId, onSelect, onNew }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const res = await fetch(`/api/conversations?agentId=${agentId}`);
    const json = await res.json();
    setConversations(json.data ?? []);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  // Refresh when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      const t = setTimeout(fetch_, 1500);
      return () => clearTimeout(t);
    }
  }, [activeConversationId, fetch_]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) onNew();
      toast.success("Conversation deleted");
    }
  }

  return (
    <div className="w-56 flex flex-col border-r border-white/[0.06] bg-black/10 flex-shrink-0">
      <div className="p-3 border-b border-white/[0.06]">
        <Button
          onClick={onNew}
          size="sm"
          className="w-full justify-start gap-2 bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/14 text-white/60 hover:text-white/80 transition-all h-8"
          variant="outline"
        >
          <Plus className="w-3.5 h-3.5" />
          New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-white/20" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-xs">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "group flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 text-xs",
                activeConversationId === conv.id
                  ? "bg-violet-500/15 text-white/80"
                  : "text-white/40 hover:text-white/60 hover:bg-white/4"
              )}
            >
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium leading-tight">
                  {conv.title ?? "New conversation"}
                </p>
                <p className="text-white/25 text-[10px] mt-0.5">
                  {conv._count.messages} msg{conv._count.messages !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
