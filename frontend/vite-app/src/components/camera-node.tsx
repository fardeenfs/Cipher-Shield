import { memo, useRef, useState, useEffect, useCallback } from "react";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {   Rotate, SquareLock01Icon, Unlock, VideoCameraAiIcon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { streamsMutations } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ButtonGroup, ButtonGroupSeparator } from "./ui/button-group";

type CameraNodeData = {
  number: number;
  label?: string;
  rotation?: number; 
  isSelected?: boolean;
};


const LOCK_STORAGE_KEY = "camera-lock";

function getInitialLockState(id: string): boolean {
  try {
    const stored = localStorage.getItem(`${LOCK_STORAGE_KEY}-${id}`);
    if (stored === null) return true; // locked by default
    return stored === "true";
  } catch {
    return true;
  }
}

type CameraNode = Node<CameraNodeData, "camera">;

const CameraNodeComponent = ({ id, data, selected }: NodeProps<CameraNode>) => {
  const { updateNodeData } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
    const [isLocked, setIsLocked] = useState(() => getInitialLockState(id));

  const queryClient = useQueryClient();
  const updateStreamMutation = useMutation(streamsMutations.update(queryClient));

  
  const toggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${LOCK_STORAGE_KEY}-${id}`, String(next));
      } catch { /* storage full — ignore */ }
      return next;
    });
  }, [id]);

  // 0 degrees if no rotation is set
  const rotation = data.rotation || 0;
  const latestRotationRef = useRef<number>(rotation);

  // Start tracking the mouse drag
  const onRotateStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLocked) return;
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
      className={cn("relative", isLocked ? "nodrag" : "")}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
{(selected || isLocked) && (
        <ButtonGroup
          className="absolute -top-8 left-1/2 -translate-x-1/2 scale-75 origin-bottom cursor-grab active:cursor-grabbing nodrag"
        >
          <Button size="xs" variant="secondary" onClick={toggleLock}>
            <HugeiconsIcon icon={isLocked ? SquareLock01Icon : Unlock} strokeWidth={2} />
          </Button>
          
          {/* Only show the separator and rotate button if the node is UNLOCKED */}
          {!isLocked && (
            <>
              <ButtonGroupSeparator />
              <Button size="xs" variant="secondary" onMouseDown={onRotateStart}>
                <HugeiconsIcon icon={Rotate} strokeWidth={2} />
              </Button>
            </>
          )}
        </ButtonGroup>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="secondary" 
            size="icon" 
            className={cn(
              "rounded-full transition-all",
              (selected || data.isSelected) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              // CHANGED: Added reduced opacity and subtle grayscale when locked
              isLocked && "opacity-60 grayscale hover:opacity-80" 
            )}
          >
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
