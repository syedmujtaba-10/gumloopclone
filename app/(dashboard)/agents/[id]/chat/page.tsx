"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { FollowUpSuggestions } from "@/components/chat/FollowUpSuggestions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/types";
import type { UIMessage } from "ai";

export default function ChatPage() {
  const { id: agentId } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const prevMessageCount = useRef(0);
  // Ref so transport's fetch closure always reads the latest conversationId
  const convIdRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with state
  useEffect(() => { convIdRef.current = conversationId; }, [conversationId]);

  // Load agent config
  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then(({ data }) => { setAgent(data); setLoadingAgent(false); })
      .catch(() => setLoadingAgent(false));
  }, [agentId]);

  // AI SDK v6: configure transport instead of passing api/body/onResponse to useChat
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({ agentId, conversationId: convIdRef.current }),
    fetch: async (input, init) => {
      const response = await globalThis.fetch(input, init);
      const newConvId = response.headers.get("X-Conversation-Id");
      if (newConvId && !convIdRef.current) {
        convIdRef.current = newConvId;
        setConversationId(newConvId);
      }
      return response;
    },
  }), [agentId]); // recreate only when agentId changes

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Watch for new assistant messages to generate suggestions
  useEffect(() => {
    if (messages.length > prevMessageCount.current && !isLoading) {
      const lastMsg = messages[messages.length - 1];
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (lastMsg?.role === "assistant" && lastUser) {
        prevMessageCount.current = messages.length;
        const text = lastMsg.parts?.map((p) => "text" in p ? p.text : "").join("") ?? "";
        fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastAssistantMessage: text,
            userMessage: lastUser.parts?.map((p) => "text" in p ? p.text : "").join("") ?? "",
          }),
        }).then((r) => r.json()).then(({ suggestions }) => setSuggestions(suggestions ?? []));
      }
    }
  }, [messages, isLoading]);

  async function handleSend(text: string) {
    setSuggestions([]);
    prevMessageCount.current = messages.length;
    await sendMessage({ text });
  }

  async function handleSuggestionClick(suggestion: string) {
    setSuggestions([]);
    prevMessageCount.current = messages.length;
    await sendMessage({ text: suggestion });
  }

  function handleNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setSuggestions([]);
    prevMessageCount.current = 0;
  }

  async function handleLoadConversation(convId: string) {
    const res = await fetch(`/api/conversations/${convId}`);
    const json = await res.json();
    if (!json.data) return;

    setConversationId(convId);
    setSuggestions([]);
    prevMessageCount.current = 0;

    interface SavedToolCall {
      toolCallId: string;
      toolName: string;
      input?: Record<string, unknown>;
    }
    interface SavedToolResult {
      toolCallId: string;
      toolName: string;
      output?: unknown;
    }
    interface SavedMessage {
      id: string;
      role: string;
      content: string;
      toolCalls?: SavedToolCall[];
      toolResults?: SavedToolResult[];
    }

    const loadedMessages: UIMessage[] = json.data.messages.map((m: SavedMessage) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UIMessage parts are typed loosely
      const parts: any[] = [];

      // Reconstruct tool call parts so the tool call UI renders on history load
      if (m.role === "assistant" && m.toolCalls?.length) {
        const resultMap = new Map(
          (m.toolResults ?? []).map((r) => [r.toolCallId, r])
        );
        for (const tc of m.toolCalls) {
          const result = resultMap.get(tc.toolCallId);
          parts.push({
            type: `tool-${tc.toolName}`,
            toolCallId: tc.toolCallId,
            state: result !== undefined ? "output-available" : "input-available",
            input: tc.input ?? {},
            output: result?.output,
          });
        }
      }

      if (m.content) {
        parts.push({ type: "text" as const, text: m.content });
      }

      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        parts,
        content: m.content,
      };
    });
    setMessages(loadedMessages);
    prevMessageCount.current = loadedMessages.length;
  }

  if (loadingAgent) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ConversationSidebar
        agentId={agentId}
        activeConversationId={conversationId}
        onSelect={handleLoadConversation}
        onNew={handleNewConversation}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href={`/agents/${agentId}`} className="text-white/30 hover:text-white/60 transition-colors">
              ←
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-sm text-white/60">
              {agent?.emoji ?? "🤖"} {agent?.name ?? "Agent"}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400/80 font-mono">
            {agent?.model ?? ""}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 pb-20">
              <div className="text-5xl">{agent?.emoji ?? "🤖"}</div>
              <div className="text-center">
                <p className="text-white/60 font-medium text-lg">{agent?.name ?? "Agent"}</p>
                <p className="text-white/30 text-sm mt-1 max-w-xs">
                  {agent?.description ?? "How can I help you today?"}
                </p>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* Follow-up suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <FollowUpSuggestions suggestions={suggestions} onSelect={handleSuggestionClick} />
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} agentId={agentId} />
      </div>
    </div>
  );
}
