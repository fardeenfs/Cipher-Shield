"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { streamsQueries, streamsMutations, blueprintsQueries } from "@/lib/queries";
import { useQueryState } from "nuqs";

import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { BOUNDS } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
const nodeTypes = {
  imageNode: ImageNode,
  cameraNode: CameraNode,
};
const initialNodes: Node[] = [
  // {
  //   id: "n1",
  //   position: { x: 0, y: 0 },
  //   data: { label: "Node 1" },
  //   type: "cameraNode",
  // },
  // {
  //   id: "n2",
  //   position: { x: 0, y: 100 },
  //   data: { label: "Node 2" },
  //   type: "cameraNode",
  // },
  {
    id: "n3",
    type: "imageNode",
    data: { label: "Node 4", showBlindSpot: true },
    position: { x: 15, y: 0 },
    zIndex: -1,
    draggable: false,
    selectable: false,
  },
];
const initialEdges: Edge[] = [];

//  component manages its own state DO NOT TOUCH IT!!!.
const FlowEditor = React.memo(() => {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const queryClient = useQueryClient();
  const updateStreamMutation = useMutation(streamsMutations.update(queryClient));
  
  const { data: blueprintsList } = useQuery(blueprintsQueries.list());
  const latestBlueprintId = blueprintsList
    ?.slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.id;

  const [selectedBlueprintId] = useQueryState("blueprint");
  const targetBlueprintId = selectedBlueprintId || latestBlueprintId;

  const { data: streams } = useQuery(
    streamsQueries.list()
  );
  const [selectedCameraId, setSelectedCamera] = useQueryState("camera");
  
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const alertTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleResize() {
      fitView();
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [fitView]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    if (streams && targetBlueprintId) {
      const placedStreams = streams.filter(s => (Math.abs(s.position_x) > 0.01 || Math.abs(s.position_y) > 0.01) && s.blueprint_id === targetBlueprintId);
      const camNodes: Node[] = placedStreams.map(s => ({
        id: String(s.id),
        type: "cameraNode",
        position: { x: s.position_x, y: s.position_y },
        data: {
          label: s.name,
          rotation: s.rotation || 0,
          isSelected: s.id === selectedCameraId,
        },
      }));
      setNodes([...initialNodes, ...camNodes]);
    }
  }, [streams, targetBlueprintId]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Retrieve the camera data from the drag event
      const dataStr = event.dataTransfer.getData("application/reactflow");
      if (!dataStr) return;

      const cameraData = JSON.parse(dataStr);
      if (nodes.filter((i) => i.data.label === cameraData.name).length > 0) {
        setDuplicateAlert(`"${cameraData.name}" is already on the canvas.`);
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => setDuplicateAlert(null), 3000);
        return;
      }

      // Convert mouse position to canvas coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: String(cameraData.id),
        type: "cameraNode",
        position,
        data: {
          label: cameraData.name,
          rotation: cameraData.rotation || 0,
          isSelected: String(cameraData.id) === selectedCameraId,
        },
      };

      setNodes((nds) => nds.concat(newNode));

      updateStreamMutation.mutate({
        id: String(cameraData.id),
        payload: {
          position_x: position.x,
          position_y: position.y,
          blueprint_id: targetBlueprintId || null,
        }
      });
    },
    [screenToFlowPosition, nodes, updateStreamMutation, targetBlueprintId],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "cameraNode") {
        updateStreamMutation.mutate({
          id: node.id,
          payload: {
            position_x: node.position.x,
            position_y: node.position.y,
          },
        });
      }
    },
    [updateStreamMutation]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
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
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "cameraNode") {
        setSelectedCamera(node.id);
      }
    },
    [setSelectedCamera]
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{ width: "100%", height: "100%" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        colorMode="dark"
        autoPanOnNodeDrag={false}
        onConnect={onConnect}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        preventScrolling={false}
        nodeExtent={[
          [0, 0],
          [BOUNDS.width, BOUNDS.height],
        ]}
        fitView
      ></ReactFlow>

      {duplicateAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 origin-top animate-in fade-in zoom-in duration-300">
          <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 shadow-md dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4" />
            <AlertTitle>Duplicate Camera</AlertTitle>
            <AlertDescription>{duplicateAlert}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
});

FlowEditor.displayName = "FlowEditor";

export default function Page() {
  return (
    <>
      <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-14" />
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
          <ReactFlowProvider>
            <FlowEditor />
          </ReactFlowProvider>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <GridLoader />
        </div>
      </main>
    </>
  );
}
