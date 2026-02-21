"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";

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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    setIsAtTop(scrollTop <= 2);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll, children]);

  return (
    <div
      className={cn("relative flex h-full flex-col overflow-hidden", className)}
    >
      {/* --- TOP PROGRESSIVE BLUR --- */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 transition-opacity duration-300",
          isAtTop ? "opacity-0" : "opacity-100",
        )}
        style={{
          // This masks the blur effect itself so it fades out smoothly
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      >
        {/* Adds a slight background tint to blend into your dark theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-transparent" />
      </div>

      {/* --- SCROLL CONTENT --- */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>

      {/* --- BOTTOM PROGRESSIVE BLUR --- */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 transition-opacity duration-300",
          isAtBottom ? "opacity-0" : "opacity-100",
        )}
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
    </div>
  );
}
