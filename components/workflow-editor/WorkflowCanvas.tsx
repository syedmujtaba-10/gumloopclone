"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { NodePalette } from "./NodePalette";
import { TriggerNode } from "./nodes/TriggerNode";
import { LLMNode } from "./nodes/LLMNode";
import { HTTPNode } from "./nodes/HTTPNode";
import { CodeNode } from "./nodes/CodeNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { OutputNode } from "./nodes/OutputNode";

// Defined outside component so the reference is stable across renders (React Flow requirement)
const NODE_TYPES = {
  trigger: TriggerNode,
  llm: LLMNode,
  http_request: HTTPNode,
  code: CodeNode,
  condition: ConditionNode,
  output: OutputNode,
};

interface Props {
  initialNodes: Node[];
  initialEdges: Edge[];
  nodeStatuses: Record<string, "running" | "success" | "error">;
  nodeOutputs?: Record<string, unknown>;
  onNodesEdgesChange: (nodes: Node[], edges: Edge[]) => void;
  isRunning?: boolean;
}

export function WorkflowCanvas({
  initialNodes,
  initialEdges,
  nodeStatuses,
  nodeOutputs = {},
  onNodesEdgesChange,
  isRunning = false,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Apply status colors to nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: nodeStatuses[n.id] ?? n.data.status ?? "idle",
        },
      }))
    );
  }, [nodeStatuses, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge({ ...connection, animated: false }, edges);
      setEdges(newEdges);
      onNodesEdgesChange(nodes, newEdges);
    },
    [edges, nodes, setEdges, onNodesEdgesChange]
  );

  function handleNodesChange(changes: Parameters<typeof onNodesChange>[0]) {
    onNodesChange(changes);
    // Debounce handled by parent
    setTimeout(() => onNodesEdgesChange(nodes, edges), 0);
  }

  function handleEdgesChange(changes: Parameters<typeof onEdgesChange>[0]) {
    onEdgesChange(changes);
    setTimeout(() => onNodesEdgesChange(nodes, edges), 0);
  }

  function addNode(type: string, label: string) {
    const id = `${type}_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 150 },
      data: {
        label,
        nodeType: type,
        config: {},
        status: "idle",
      },
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onNodesEdgesChange(newNodes, edges);
    setSelectedNode(newNode);
  }

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
      )
    );
    // Keep selectedNode in sync so the panel reflects the latest data
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data: { ...prev.data, config } } : prev
    );
    const updatedNodes = nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
    );
    onNodesEdgesChange(updatedNodes, edges);
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={isRunning ? null : "Delete"}
        nodesDraggable={!isRunning}
        nodesConnectable={!isRunning}
        elementsSelectable={!isRunning}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const status = n.data?.status;
            if (status === "running") return "rgba(96,165,250,0.6)";
            if (status === "success") return "rgba(52,211,153,0.6)";
            if (status === "error") return "rgba(248,113,113,0.6)";
            return "rgba(139,92,246,0.3)";
          }}
          maskColor="rgba(0,0,0,0.4)"
        />

        {/* Node palette panel */}
        <Panel position="top-left">
          <NodePalette onAddNode={addNode} />
        </Panel>
      </ReactFlow>

      {/* Config panel — key forces remount when selected node changes so useState reinitializes */}
      {selectedNode && (
        <NodeConfigPanel
          key={selectedNode.id}
          node={selectedNode}
          lastOutput={nodeOutputs[selectedNode.id]}
          onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
