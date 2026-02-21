"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import GridLoader from "./grid-loader";
import ImageNode from "./image-node";
import CameraNode from "./camera-node";
const nodeTypes = {
  imageNode: ImageNode,
  cameraNode: CameraNode,
};
const initialNodes: Node[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    data: { label: "Node 1" },
    type: "cameraNode",
  },
  {
    id: "n2",
    position: { x: 0, y: 100 },
    data: { label: "Node 2" },
    type: "cameraNode",
  },
  {
    id: "n3",
    type: "imageNode",
    data: { label: "Node 4" },
    position: { x: 0, y: 0 },
    zIndex: -1,
    draggable: false,
    selectable: false,
  },
];
const initialEdges: Edge[] = [];

//  component manages its own state DO NOT TOUCH IT!!!.
const FlowEditor = React.memo(() => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const BOUNDS = { width: 600, height: 400 };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextChanges = changes.map((change) => {
        if (change.type === "position" && change.position) {
          const { x, y } = change.position;

          // Clamp the values between 0 and the max width/height
          // Note: We subtract a small amount (like 40) so the node doesn't sit exactly on the edge
          return {
            ...change,
            position: {
              x: Math.max(0, Math.min(x, BOUNDS.width - 50)),
              y: Math.max(0, Math.min(y, BOUNDS.height - 40)),
            },
          };
        }
        return change;
      });

      setNodes((nds) => applyNodeChanges(nextChanges, nds));
    },
    [BOUNDS.width, BOUNDS.height],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      colorMode="dark"
      autoPanOnNodeDrag={false}
      onConnect={onConnect}
      panOnDrag={false}
      zoomOnScroll={false}
      nodeExtent={[
        [0, 0],
        [600, 400],
      ]}
      fitView
    >
      <Background color="#ccc" />
    </ReactFlow>
  );
});

FlowEditor.displayName = "FlowEditor";

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Project Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="relative flex-1 bg-background">
          <div className="absolute inset-0 overflow-hidden">
            <FlowEditor />
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <GridLoader />
          </div>
        </main>
      </SidebarInset>
      <SidebarRight />
    </SidebarProvider>
  );
}
