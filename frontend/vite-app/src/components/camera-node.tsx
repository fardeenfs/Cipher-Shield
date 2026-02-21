import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraLensIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils"; // Standard shadcn utility
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

type CameraNodeData = {
  number: number;
  label?: string;
};

type CameraNode = Node<CameraNodeData, "camera">;

const CameraNodeComponent = ({ data, selected }: NodeProps<CameraNode>) => {
  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <HugeiconsIcon icon={CameraLensIcon} />
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
