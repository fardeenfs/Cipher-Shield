"use client"; // Required because we are using hooks now!

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export function ScrollBlur({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    setIsAtTop(scrollTop <= 0);
    setIsAtBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
  };

  useEffect(() => {
    checkScroll();
  }, [children]);

  return (
    <div
      ref={scrollRef}
      onScroll={checkScroll}
      className={cn(
        "relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className,
      )}
    >
      {/* Top Blur */}
      <div
        className={cn(
          "from-background via-background/10 to-transparent sticky -top-1 z-10 h-8 shrink-0 bg-gradient-to-b blur-xs pointer-events-none transition-opacity duration-300 ease-in-out",
          isAtTop ? "opacity-0" : "opacity-100",
        )}
      />

      {/* Content */}
      <div className=" -mt-8 -mb-16">{children}</div>

      {/* Bottom Blur */}
      <div
        className={cn(
          "from-background via-background/10 to-background/50 sticky -bottom-1 z-10 h-16 shrink-0 bg-gradient-to-t blur-xs pointer-events-none transition-opacity duration-300 ease-in-out",
          isAtBottom ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}
