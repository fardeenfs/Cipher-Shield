import * as motion from "motion/react-client";
import type { Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { ItemDescription, ItemTitle } from "./ui/item";
import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button"; // Added Button
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Replace with your actual icon import
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsMutations } from "@/lib/queries";

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  risk_level: string;
}

interface TimelineItemProps {
  entry: TimelineEntry;
  index: number;
  isLast: boolean;
  onResolve?: () => void; // Added callback prop
  hideResolve?: boolean;
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

export function TimelineItem({
  entry,
  index,
  isLast,
  onResolve,
  hideResolve,
}: TimelineItemProps) {
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
            "z-10 h-2 w-2 shrink-0 bg-foreground transition-all duration-300",
          )}
        />
        {!isLast && <div className="mt-0 w-px flex-1 bg-border" />}
      </div>

      {/* Content side */}
      <div
        className={cn(
          "flex-1 pb-12 transition-all duration-500 ease-out translate-y-0 opacity-100",
        )}
      >
        <ItemContent entry={entry} onResolve={onResolve} hideResolve={hideResolve} />
      </div>
    </motion.div>
  );
}

function ItemContent({
  entry,
  onResolve,
  hideResolve,
}: {
  entry: TimelineEntry;
  onResolve?: () => void;
  hideResolve?: boolean;
}) {
  const queryClient = useQueryClient();
  const updateEventMutation = useMutation(eventsMutations.update(queryClient));

  return (
    <motion.div variants={cardVariants} className="space-y-3">
      <div className="flex w-full items-start justify-between">
        <div className="space-y-1">
          <ItemTitle>{entry.title}</ItemTitle>
          <ItemDescription>{entry.date}</ItemDescription>
        </div>
        <Badge variant={entry.risk_level.toLowerCase() === 'high' ? 'destructive' : entry.risk_level.toLowerCase() === 'medium' ? 'default' : 'secondary'} className="capitalize">{entry.risk_level}</Badge>
      </div>

      {entry.image && (
        <div className="group relative overflow-hidden rounded-none border border-border">
          <img
            src={entry.image}
            alt={entry.imageAlt || "Event Frame"}
            className="aspect-3/2 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] cursor-pointer"
          />
        </div>
      )}

      <ItemDescription>{entry.description}</ItemDescription>

      {/* Resolve Action Container */}
      {!hideResolve && (
        <div className="pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {/* Using your custom icon wrapper */}
                <div className="mr-2">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} />
                </div>
                Resolve Incident
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resolve Incident?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark this incident as resolved? It will be moved to the resolved events list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    updateEventMutation.mutate(
                      { id: entry.id, payload: { status: "resolved" } },
                      {
                        onSuccess: () => {
                          if (onResolve) onResolve();
                        },
                      }
                    );
                  }}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Mark as Resolved
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.div>
  );
}
