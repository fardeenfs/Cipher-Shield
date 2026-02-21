import * as motion from "motion/react-client";
import type { Variants } from "motion/react";

import { cn } from "@/lib/utils";
import { ItemDescription, ItemTitle } from "./ui/item";
import { Badge } from "./ui/badge";

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

interface TimelineItemProps {
  entry: TimelineEntry;
  index: number;
  isLast: boolean;
}

const cardVariants: Variants = {
  offscreen: {
    scale: 0.97,
    opacity: 0.97,
  },
  onscreen: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

export function TimelineItem({ entry, index, isLast }: TimelineItemProps) {
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ amount: 1 }}
      className="relative flex gap-2 pl-1 pr-2"
    >
      {/* Left line + dot */}
      <div className="relative flex flex-col items-center pt-1">
        <div
          className={cn(
            "z-10 h-2 w-2 shrink-0 rounded-full bg-foreground transition-all duration-300",
          )}
        />
        {!isLast && <div className="mt-0 w-px flex-1 bg-border" />}
      </div>

      {/* Content side (right only) */}
      <div
        className={cn(
          "flex-1 pb-8 transition-all duration-500 ease-out",
          "translate-y-0 opacity-100",
        )}
      >
        <ItemContent entry={entry} />
      </div>
    </motion.div>
  );
}

function ItemContent({ entry }: { entry: TimelineEntry }) {
  return (
    <motion.div variants={cardVariants} className="space-y-3">
      <div className="flex w-full items-start justify-between">
        <div className="space-y-1">
          <ItemTitle>{entry.title}</ItemTitle>
          <ItemDescription>{entry.date}</ItemDescription>
        </div>
        <Badge variant="destructive">Low</Badge>
      </div>

      <div className="group relative overflow-hidden rounded-none border border-border">
        <img
          src={entry.image}
          alt={entry.imageAlt}
          className="aspect-3/2 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] cursor-pointer"
        />
      </div>
      <ItemDescription>{entry.description}</ItemDescription>
    </motion.div>
  );
}
