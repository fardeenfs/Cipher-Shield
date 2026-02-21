import { memo } from "react";
import img from "../assets/blueprint-1.jpg";
import { BOUNDS } from "@/lib/constants";
const ImageNode = () => {
  return (
    <div
      style={{
        backgroundImage: `url(${img})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        height: BOUNDS.height,
        width: BOUNDS.width,
        pointerEvents: "none",
      }}
    ></div>
  );
};

ImageNode.displayName = "ImageNode";

export default memo(ImageNode);
