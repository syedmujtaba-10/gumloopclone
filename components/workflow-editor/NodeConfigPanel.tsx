"use client";

import { useState } from "react";
import type { Node } from "reactflow";
import { X, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  node: Node;
  lastOutput?: unknown;
  onUpdate: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, lastOutput, onUpdate, onClose }: Props) {
  const [config, setConfig] = useState<Record<string, unknown>>(node.data.config ?? {});

  function set(key: string, value: unknown) {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onUpdate(updated);
  }

  const nodeType = node.data.nodeType ?? node.type;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-[#0d0d12]/95 backdrop-blur-xl border-l border-white/[0.08] z-10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] flex-shrink-0">
        <div className="h-14 flex items-center justify-between px-4">
          <h3 className="text-sm font-medium text-white/80">Configure Node</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Node ID — shown so users can reference it in templates like {{nodeId}} */}
        <div className="px-4 pb-2.5 flex items-center gap-2">
          <span className="text-[10px] text-white/25 uppercase tracking-wider">ID</span>
          <code className="text-[11px] font-mono text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded select-all truncate">
            {node.id}
          </code>
        </div>
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">

        {/* TRIGGER */}
        {nodeType === "trigger" && (
          <div className="space-y-3">
            <Label className="text-white/50 text-xs uppercase tracking-wider">Trigger Type</Label>
            <Select value={String(config.triggerType ?? "manual")} onValueChange={(v) => set("triggerType", v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white/75">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="manual">▶ Manual</SelectItem>
                <SelectItem value="webhook">🔗 Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* LLM */}
        {nodeType === "llm" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Model</Label>
              <Select value={String(config.model ?? "claude-haiku-4-5-20251001")} onValueChange={(v) => set("model", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/75">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="">
                  <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5</SelectItem>
                  <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
                  <SelectItem value="claude-opus-4-6">Claude Opus 4.6</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">System Prompt</Label>
              <Textarea
                value={String(config.systemPrompt ?? "")}
                onChange={(e) => set("systemPrompt", e.target.value)}
                placeholder="You are a helpful assistant…"
                rows={3}
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Prompt</Label>
              <Textarea
                value={String(config.prompt ?? "")}
                onChange={(e) => set("prompt", e.target.value)}
                placeholder="{{input}}"
                rows={4}
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono resize-none"
              />
              <p className="text-[10px] text-white/25">Use <span className="font-mono text-violet-400/50">{"{{nodeId}}"}</span> to reference another node — copy the ID from its config panel header.</p>
            </div>
          </>
        )}

        {/* HTTP Request */}
        {nodeType === "http_request" && (
          <>
            <div className="flex gap-2">
              <div className="w-24">
                <Label className="text-white/50 text-xs uppercase tracking-wider">Method</Label>
                <Select value={String(config.method ?? "GET")} onValueChange={(v) => set("method", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white/75 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="">
                    {["GET","POST","PUT","DELETE","PATCH"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-white/50 text-xs uppercase tracking-wider">URL</Label>
                <Input
                  value={String(config.url ?? "")}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://api.example.com/…"
                  className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs mt-1.5"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Body (JSON)</Label>
              <Textarea
                value={String(config.body ?? "")}
                onChange={(e) => set("body", e.target.value)}
                placeholder='{"key": "{{input}}"}'
                rows={3}
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono resize-none"
              />
            </div>
          </>
        )}

        {/* Scrape URL */}
        {nodeType === "scrape" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">URL</Label>
              <Input
                value={String(config.url ?? "")}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://example.com"
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono"
              />
              <p className="text-[10px] text-white/25">Supports <span className="font-mono text-teal-400/50">{"{{nodeId}}"}</span> templates</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Output Format</Label>
              <Select value={String(config.format ?? "markdown")} onValueChange={(v) => set("format", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/75">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="">
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Code */}
        {nodeType === "code" && (
          <div className="space-y-1.5">
            <Label className="text-white/50 text-xs uppercase tracking-wider">Python Code</Label>
            <Textarea
              value={String(config.code ?? "")}
              onChange={(e) => set("code", e.target.value)}
              placeholder="# Input available as 'input_data'\nprint(input_data)"
              rows={10}
              className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono resize-none"
            />
            <p className="text-[10px] text-white/25">Use {"{{nodeId}}"} in string templates, or access prev output via the input variable</p>
          </div>
        )}

        {/* Condition */}
        {nodeType === "condition" && (
          <div className="space-y-1.5">
            <Label className="text-white/50 text-xs uppercase tracking-wider">Condition Expression</Label>
            <Input
              value={String(config.expression ?? "")}
              onChange={(e) => set("expression", e.target.value)}
              placeholder='input.includes("error")'
              className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono"
            />
            <p className="text-[10px] text-white/25">JS expression. Use "input" for previous node output.</p>
          </div>
        )}

        {/* Output */}
        {nodeType === "output" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Label</Label>
              <Input
                value={String(config.label ?? "")}
                onChange={(e) => set("label", e.target.value)}
                placeholder="Output"
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Output Format</Label>
              <Select value={String(config.format ?? "text")} onValueChange={(v) => set("format", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/75">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="">
                  <SelectItem value="text">Plain Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase tracking-wider">Template</Label>
              <Textarea
                value={String(config.template ?? "{{input}}")}
                onChange={(e) => set("template", e.target.value)}
                placeholder="{{input}}"
                rows={3}
                className="bg-white/5 border-white/10 text-white/75 placeholder:text-white/20 text-xs font-mono resize-none"
              />
              <p className="text-[10px] text-white/25">
                <span className="font-mono">{"{{input}}"}</span> auto-passes the previous node&apos;s result. Use <span className="font-mono">{"{{nodeId}}"}</span> for a specific node.
              </p>
            </div>

            {/* Last Output section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-white/50 text-xs uppercase tracking-wider">Last Output</Label>
                {lastOutput !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
              {lastOutput !== undefined ? (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <pre className="p-3 text-[11px] text-white/60 overflow-x-auto overflow-y-auto max-h-48 scrollbar-thin leading-relaxed font-mono whitespace-pre-wrap break-words">
                    {typeof lastOutput === "string"
                      ? lastOutput
                      : JSON.stringify(lastOutput, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] px-3 py-4 text-center">
                  <p className="text-[11px] text-white/20">Run the workflow to see output here</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
