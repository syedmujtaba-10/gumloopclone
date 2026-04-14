import type { Agent, Workflow, Conversation, Message, WorkflowRun } from "@prisma/client";

// Re-export Prisma types
export type { Agent, Workflow, Conversation, Message, WorkflowRun };

// ─── Agent ────────────────────────────────────────────────────────────────────

export type AgentWithConversationCount = Agent & {
  _count: { conversations: number };
};

export type ToolName =
  | "web_search"
  | "web_scrape"
  | "http_request"
  | "sandbox"
  | "image_gen";



export const ALL_TOOLS: { id: ToolName; label: string; description: string; icon: string }[] = [
  {
    id: "web_search",
    label: "Web Search",
    description: "Search the web for real-time information",
    icon: "Search",
  },
  {
    id: "http_request",
    label: "HTTP Request",
    description: "Call any external API or webhook",
    icon: "Globe",
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Run Python, shell commands, and read/write files in an isolated VM",
    icon: "Terminal",
  },
  {
    id: "web_scrape",
    label: "Web Scrape",
    description: "Scrape any URL and read its content as clean markdown",
    icon: "Globe2",
  },
  {
    id: "image_gen",
    label: "Image Generation",
    description: "Generate images from text prompts using DALL-E 3",
    icon: "Sparkles",
  },
];

export const MODEL_OPTIONS = [
  {
    group: "Anthropic",
    models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    group: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
  },
] as const;

// ─── Workflow ──────────────────────────────────────────────────────────────────

export type NodeType =
  | "trigger"
  | "llm"
  | "http_request"
  | "code"
  | "condition"
  | "scrape"
  | "output";

export interface WorkflowNodeData {
  label: string;
  nodeType: NodeType;
  config: Record<string, unknown>;
  status?: "idle" | "running" | "success" | "error";
  output?: unknown;
  error?: string;
}

export interface WorkflowSSEEvent {
  type: "node_start" | "node_complete" | "node_error" | "workflow_complete" | "workflow_error";
  nodeId?: string;
  nodeType?: string;
  output?: unknown;
  error?: string;
  duration?: number;
  runId: string;
}

// ─── Chat / Messages ──────────────────────────────────────────────────────────

export interface ToolCallDisplay {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "complete" | "error";
}

export interface ChatFile {
  name: string;
  type: string;
  url: string;
  extractedText?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
