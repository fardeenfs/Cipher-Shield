import { memo } from "react";
import img from "../assets/blueprint-1.jpg";
const ImageNode = () => {
  return (
    <div
      style={{
        backgroundImage: `url(${img})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        height: 400,
        width: 600,
        pointerEvents: "none",
      }}
    ></div>
  );
};

ImageNode.displayName = "ImageNode";

export default memo(ImageNode);
