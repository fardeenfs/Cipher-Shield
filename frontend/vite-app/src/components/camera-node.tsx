import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraLensIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils"; // Standard shadcn utility

type CameraNodeData = {
  number: number;
  label?: string;
};

type CameraNode = Node<CameraNodeData, "camera">;

const CameraNodeComponent = ({ data, selected }: NodeProps<CameraNode>) => {
  return (
    <div className="group relative">
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border whitespace-nowrap">
          {data.label || `Camera ${data.number}`}
        </div>
      </div>

      <div
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-full border shadow-sm transition-all duration-300",
          "bg-background/80 backdrop-blur-md",
          selected
            ? "border-primary ring-2 ring-primary/20 scale-110 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
            : "border-border hover:border-primary/50",
        )}
      >
        {/* Active Status Pulse */}
        <span className="absolute right-1 top-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>

        <HugeiconsIcon
          icon={CameraLensIcon}
          className={cn(
            "h-5 w-5 transition-colors",
            selected
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
        />
      </div>
    </div>
  );
};

CameraNodeComponent.displayName = "CameraNode";

export default memo(CameraNodeComponent);
