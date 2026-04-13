export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    config: Record<string, unknown>;
    status: "idle";
  };
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "weather_report",
    name: "Weather Report",
    emoji: "🌤️",
    description: "Fetch current weather for a city and summarise it with AI",
    nodes: [
      {
        id: "trigger_1",
        type: "trigger",
        position: { x: 80, y: 200 },
        data: { label: "Trigger", nodeType: "trigger", config: { triggerType: "manual" }, status: "idle" },
      },
      {
        id: "http_1",
        type: "http_request",
        position: { x: 320, y: 200 },
        data: {
          label: "HTTP Request",
          nodeType: "http_request",
          config: { method: "GET", url: "https://wttr.in/{{input}}?format=j1" },
          status: "idle",
        },
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 560, y: 200 },
        data: {
          label: "AI / LLM",
          nodeType: "llm",
          config: {
            model: "claude-haiku-4-5-20251001",
            systemPrompt: "You are a friendly weather reporter.",
            prompt: "Here is the weather JSON for the requested location. Write a short, friendly 2-3 sentence weather summary:\n\n{{http_1}}",
          },
          status: "idle",
        },
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 800, y: 200 },
        data: { label: "Output", nodeType: "output", config: { format: "text", template: "{{llm_1}}" }, status: "idle" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger_1", target: "http_1" },
      { id: "e2", source: "http_1", target: "llm_1" },
      { id: "e3", source: "llm_1", target: "output_1" },
    ],
  },
  {
    id: "tech_news",
    name: "Tech News Briefing",
    emoji: "📰",
    description: "Pull the latest tech articles from DEV.to and summarise them",
    nodes: [
      {
        id: "trigger_1",
        type: "trigger",
        position: { x: 80, y: 200 },
        data: { label: "Trigger", nodeType: "trigger", config: { triggerType: "manual" }, status: "idle" },
      },
      {
        id: "http_1",
        type: "http_request",
        position: { x: 320, y: 200 },
        data: {
          label: "HTTP Request",
          nodeType: "http_request",
          config: { method: "GET", url: "https://dev.to/api/articles?per_page=5&top=1" },
          status: "idle",
        },
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 560, y: 200 },
        data: {
          label: "AI / LLM",
          nodeType: "llm",
          config: {
            model: "claude-haiku-4-5-20251001",
            systemPrompt: "You are a concise tech news editor.",
            prompt: "Here are today's top DEV.to articles as JSON. Write a short briefing with the top 3 articles, including title, author, and a one-sentence summary:\n\n{{http_1}}",
          },
          status: "idle",
        },
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 800, y: 200 },
        data: { label: "Output", nodeType: "output", config: { format: "markdown", template: "{{llm_1}}" }, status: "idle" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger_1", target: "http_1" },
      { id: "e2", source: "http_1", target: "llm_1" },
      { id: "e3", source: "llm_1", target: "output_1" },
    ],
  },
  {
    id: "web_researcher",
    name: "Web Researcher",
    emoji: "🔬",
    description: "Scrape any URL and get an AI-powered summary",
    nodes: [
      {
        id: "trigger_1",
        type: "trigger",
        position: { x: 80, y: 200 },
        data: { label: "Trigger", nodeType: "trigger", config: { triggerType: "manual" }, status: "idle" },
      },
      {
        id: "scrape_1",
        type: "scrape",
        position: { x: 320, y: 200 },
        data: {
          label: "Scrape URL",
          nodeType: "scrape",
          config: { url: "{{input}}", format: "markdown" },
          status: "idle",
        },
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 560, y: 200 },
        data: {
          label: "AI / LLM",
          nodeType: "llm",
          config: {
            model: "claude-haiku-4-5-20251001",
            systemPrompt: "You are a research assistant that produces concise summaries.",
            prompt: "Summarise the following web page content in 3-5 bullet points:\n\n{{scrape_1}}",
          },
          status: "idle",
        },
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 800, y: 200 },
        data: { label: "Output", nodeType: "output", config: { format: "markdown", template: "{{llm_1}}" }, status: "idle" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger_1", target: "scrape_1" },
      { id: "e2", source: "scrape_1", target: "llm_1" },
      { id: "e3", source: "llm_1", target: "output_1" },
    ],
  },
  {
    id: "text_summarizer",
    name: "Text Summarizer",
    emoji: "✂️",
    description: "Paste any text as input and get a clean AI summary",
    nodes: [
      {
        id: "trigger_1",
        type: "trigger",
        position: { x: 80, y: 200 },
        data: { label: "Trigger", nodeType: "trigger", config: { triggerType: "manual" }, status: "idle" },
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 320, y: 200 },
        data: {
          label: "AI / LLM",
          nodeType: "llm",
          config: {
            model: "claude-haiku-4-5-20251001",
            systemPrompt: "You are an expert summarizer. Be concise and accurate.",
            prompt: "Summarise the following text in 3-5 bullet points, then provide a one-paragraph executive summary:\n\n{{input}}",
          },
          status: "idle",
        },
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 560, y: 200 },
        data: { label: "Output", nodeType: "output", config: { format: "markdown", template: "{{llm_1}}" }, status: "idle" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger_1", target: "llm_1" },
      { id: "e2", source: "llm_1", target: "output_1" },
    ],
  },
];
