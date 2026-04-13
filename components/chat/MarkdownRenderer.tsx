"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./CopyButton";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks with copy button
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? "");
          const isBlock = className?.startsWith("language-");
          const code = String(children).replace(/\n$/, "");

          if (isBlock) {
            return (
              <div className="relative group mt-3 mb-3">
                <div className="flex items-center justify-between bg-white/5 border-b border-white/8 px-3 py-1.5 rounded-t-lg">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                    {match?.[1] ?? "code"}
                  </span>
                  <CopyButton text={code} className="opacity-0 group-hover:opacity-100" />
                </div>
                <pre className="bg-black/30 border border-white/8 border-t-0 rounded-b-lg overflow-x-auto p-3 text-[12px] leading-relaxed scrollbar-thin">
                  <code className={`font-mono text-white/75 ${className}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          }

          return (
            <code
              className="font-mono text-violet-300/90 bg-violet-500/10 px-1 py-0.5 rounded text-[0.85em]"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Headings
        h1: ({ children }) => <h1 className="text-lg font-bold text-white/90 mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold text-white/85 mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-white/80 mt-2 mb-1">{children}</h3>,

        // Lists
        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2 text-white/75">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2 text-white/75">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,

        // Paragraphs
        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-violet-500/40 pl-3 my-2 text-white/50 italic">
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 scrollbar-thin">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-white/10 bg-white/5 px-3 py-1.5 text-left text-white/60 font-medium text-xs uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-white/8 px-3 py-1.5 text-white/65 text-xs">{children}</td>
        ),

        // Horizontal rule
        hr: () => <hr className="border-white/10 my-4" />,

        // Strong / em
        strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,
        em: ({ children }) => <em className="italic text-white/65">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
