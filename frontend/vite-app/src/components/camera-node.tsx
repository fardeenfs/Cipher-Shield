import { memo, useRef, useState, useEffect } from "react";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { VideoCameraAiIcon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { streamsMutations } from "@/lib/queries";

type CameraNodeData = {
  number: number;
  label?: string;
  rotation?: number; // 1. Add rotation to your data type
};

type CameraNode = Node<CameraNodeData, "camera">;

const CameraNodeComponent = ({ id, data, selected }: NodeProps<CameraNode>) => {
  const { updateNodeData } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  
  const queryClient = useQueryClient();
  const updateStreamMutation = useMutation(streamsMutations.update(queryClient));

  // 0 degrees if no rotation is set
  const rotation = data.rotation || 0;
  const latestRotationRef = useRef<number>(rotation);

  // Start tracking the mouse drag
  const onRotateStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsRotating(true);
  };

  // Calculate the angle as the mouse moves
  useEffect(() => {
    if (!isRotating) return;

    const onMouseMove = (event: MouseEvent) => {
      if (!nodeRef.current) return;

      const bounds = nodeRef.current.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      // find the angle between the node's center and the mouse
      const radians = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX,
      );
      let degrees = radians * (180 / Math.PI);

      // Add 90 degrees because our handle is positioned at the top (-top-6)
      degrees += 90;

      updateNodeData(id, { rotation: degrees });
      latestRotationRef.current = degrees;
    };

    const onMouseUp = () => {
      setIsRotating(false);
      updateStreamMutation.mutate({
        id,
        payload: { rotation: latestRotationRef.current }
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Cleanup listeners
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [id, isRotating, updateNodeData]);

  return (
    <div
      ref={nodeRef}
      className="relative"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/*  Handle (Only visible when node is selected) */}
      {selected && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing nodrag"
          onMouseDown={onRotateStart}
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <HugeiconsIcon icon={VideoCameraAiIcon} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {data.label || `Camera ${data.number}`}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

CameraNodeComponent.displayName = "CameraNode";

export default memo(CameraNodeComponent);
