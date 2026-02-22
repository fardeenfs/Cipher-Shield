import { memo } from "react";
import { useNodes } from "@xyflow/react";
import { BOUNDS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { blueprintsQueries } from "@/lib/queries";
import { useQueryState } from "nuqs";

const ImageNode = () => {
  const nodes = useNodes();
  const [blueprintMode] = useQueryState("blueprintMode");
  const showBlindSpot = blueprintMode === "off";

  const { data: blueprintsList } = useQuery(blueprintsQueries.list());
  const latestBlueprintId = blueprintsList
    ?.slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.id;

  const [selectedBlueprintId] = useQueryState("blueprint");
  const targetBlueprintId = selectedBlueprintId || latestBlueprintId;

  const { data: blueprintDetails } = useQuery({
    ...blueprintsQueries.detail(targetBlueprintId as string),
    enabled: !!targetBlueprintId,
  });

  const displayImage = blueprintDetails?.image_base64
    ? `data:image/jpeg;base64,${blueprintDetails.image_base64}`
    : '';

  const cameras = nodes.filter((n) => n.type === "cameraNode");

  const BEAM_LENGTH = 250;
  // How wide the camera angle is
  const FOV_DEGREES = 60;

  return (
    <div
      style={{
        height: BOUNDS.height,
        width: BOUNDS.width,
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          {/* soft blur to the edges of the light beams */}
          <filter id="beam-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur" />
          </filter>

          <mask id="camera-vision-mask">
            {/* The base layer: makes the whole blueprint 30% visible */}
            <rect
              width="100%"
              height="100%"
              fill="white"
              opacity={!showBlindSpot ? "1" : "0.3"}
            />

            {/* The light beams: overrides the mask to be 100% visible */}
            <g filter="url(#beam-blur)">
              {cameras.map((cam) => {
                // Determine rotation (0 degrees is UP based on your handle logic)
                const rot = (cam.data?.rotation as number) || 0;

                // Convert rotation to standard math radians (-90 shifts UP to standard origin)
                const theta = rot * (Math.PI / 180);
                const halfFov = (FOV_DEGREES / 2) * (Math.PI / 180);

                // Find the center of the camera node (fallback to 40px if not fully mounted)
                const w = cam.measured?.width || 40;
                const h = cam.measured?.height || 40;
                const cx = cam.position.x + w / 2;
                const cy = cam.position.y + h / 2;

                // Calculate the left and right edge points of the cone using Trigonometry
                const leftX = cx + BEAM_LENGTH * Math.cos(theta - halfFov);
                const leftY = cy + BEAM_LENGTH * Math.sin(theta - halfFov);
                const rightX = cx + BEAM_LENGTH * Math.cos(theta + halfFov);
                const rightY = cy + BEAM_LENGTH * Math.sin(theta + halfFov);

                // Create an SVG Path for a wedge (Line to Left, Arc to Right, Close back to Center)
                const pathData = `M ${cx},${cy} L ${leftX},${leftY} A ${BEAM_LENGTH},${BEAM_LENGTH} 0 0,1 ${rightX},${rightY} Z`;

                return (
                  <path
                    key={cam.id}
                    d={pathData}
                    fill="white"
                    opacity={showBlindSpot ? "1" : "0"}
                  />
                );
              })}
            </g>
          </mask>
        </defs>

        {/* use an SVG <image> tag instead of CSS background.
          This behaves exactly like backgroundSize: "contain" 
          but allows us to apply the dynamic lighting mask! 
        */}
        <image
          href={displayImage}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          mask="url(#camera-vision-mask)"
        />
      </svg>
    </div>
  );
};

ImageNode.displayName = "ImageNode";

export default memo(ImageNode);
