import * as React from "react";
import * as motion from "motion/react-client";
import type { Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, ArrowRight01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsMutations } from "@/lib/queries";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarSeparator } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  risk_level: string;
  triggered_rule?: string | null;
  status?: string;
}

interface TimelineItemProps {
  entry: TimelineEntry;
  index: number;
  isLast: boolean;
  onResolve?: () => void;
}

const cardVariants: Variants = {
  offscreen: {
    scale: 0.90,
    opacity: 0.90,
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
}: TimelineItemProps) {
  const queryClient = useQueryClient();
  const updateEventMutation = useMutation(eventsMutations.update(queryClient));

  const risk = entry.risk_level?.toLowerCase() || 'none';
  const severityColor = risk === 'high' ? 'bg-destructive' 
                      : risk === 'medium' ? 'bg-amber-500' 
                      : risk === 'low' ? 'bg-green-500' : 'bg-muted';
                      
  const badgeVariant = risk === 'high' ? 'destructive' : risk === 'medium' ? 'warning' : risk === 'low' ? 'success' : 'secondary';

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{  amount: "some" }}
      variants={cardVariants}
      className="mb-1"
    >
      <SidebarGroup className="px-0 py-0">
        <Collapsible className={cn("group/collapsible transition-all", entry.triggered_rule && "border-l-4 border-primary rounded-l-none")}>
          <SidebarGroupLabel 
            asChild 
            className={cn(
              "group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full py-3 h-auto cursor-pointer",
            )}
          >
            <CollapsibleTrigger className="flex flex-col items-start w-full">
               <div className="flex w-full items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className={cn("size-2.5", severityColor)} />
                    <span className="font-semibold text-foreground text-sm ">
                      <Tooltip>
                        <TooltipTrigger className="text-start line-clamp-1">
                          {entry.title}
                        </TooltipTrigger>
                        <TooltipContent side="left">
                         {entry.title}
                        </TooltipContent>
                      </Tooltip>
                      
                      </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Badge variant={badgeVariant} className="capitalize text-[10px] h-5 px-1.5">{entry.risk_level}</Badge>
                   <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 transition-transform group-data-[state=open]/collapsible:rotate-90 text-muted-foreground size-4" />
                 </div>
               </div>
               <div className="mt-1 text-xs text-muted-foreground w-full text-left font-normal pl-4.5 line-clamp-1 pr-6">
                 {entry.date} - {entry.description}
               </div>
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent className="px-4 pb-4 pt-2 space-y-3">
              {entry.image && (
                <div className="group relative overflow-hidden rounded-none border border-border mt-2">
                  <img
                    src={entry.image}
                    alt={entry.imageAlt || "Event Frame"}
                    className="aspect-3/2 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] cursor-pointer"
                  />
                </div>
              )}

              {entry.triggered_rule && (
                <Item variant="outline" className="mt-1 w-full pointer-events-none">
                  <ItemContent className="flex w-full flex-col items-start gap-1.5">
                    <ItemTitle className="uppercase flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground leading-none">
                      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2.5} className="size-3 text-primary" />
                      Rule Triggered
                    </ItemTitle>
                    <ItemDescription className="text-xs font-medium text-foreground leading-snug line-clamp-none whitespace-normal">
                      {entry.triggered_rule}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )}

              <div className="text-sm text-foreground leading-relaxed mt-1">
                {entry.description}
              </div>

              <div className="pt-2">
                {entry.status === "resolved" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="mr-2">
                          <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} />
                        </div>
                        Unresolve Incident
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unresolve Incident?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to mark this incident as unresolved? It will be moved back to the active events list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            updateEventMutation.mutate(
                              { id: entry.id, payload: { status: "active" } },
                              {
                                onSuccess: () => {
                                  if (onResolve) onResolve();
                                },
                              }
                            );
                          }}
                          className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                          Mark as Unresolved
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
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
                )}
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
      {!isLast && <SidebarSeparator className="mx-0" />}
    </motion.div>
  );
}
