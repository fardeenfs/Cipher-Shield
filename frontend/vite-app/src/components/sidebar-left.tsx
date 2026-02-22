"use client";

import * as React from "react";

import { NavCamera } from "@/components/nav-camera";
import { NavBlueprint } from "@/components/nav-blueprint";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AddCameraDialog } from "./add-camera-dialog";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rulesQueries, streamsQueries } from "@/lib/queries";
import { StreamActivityCard } from "./stream-activity-card";
import { ActiveRulesCard } from "./active-rules-card";
import { GlobalPhoneNumberDialog } from "./add-phone-number-dialog";
import { ArrowLeftIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "./ui/button";


export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar();

  const matchRoute = useMatchRoute();

  const isIndexRoute = matchRoute({ to: "/" });
  const isStreamRoute = matchRoute({ to: "/stream/$id" });

  const streamId = isStreamRoute ? (isStreamRoute as any).id : "";

  const { data: stream } = useQuery({
    ...streamsQueries.detail(streamId),
    enabled: !!streamId,
  });

  const { data: rules } = useQuery({
    ...rulesQueries.list(streamId),
    enabled: !!streamId,
  });

  const renderContent = React.useMemo(() => {
    if (isIndexRoute) {
      return (
        <>

          <SidebarContent className="gap-4 p-2.5">
            <NavCamera />
                        <NavBlueprint />

            {/* <NavPrompts prompts={prompts} /> */}
          </SidebarContent>
          <SidebarRail />
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <GlobalPhoneNumberDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      );
    }
    if (isStreamRoute) {
      return (
        <>
          <SidebarContent className="gap-4 p-2.5">
            {/* HUD Container */}
            <StreamActivityCard streamId={streamId} />
            <ActiveRulesCard streamId={streamId} streamName={stream?.name || "Loading..."} rules={rules} isMobile={isMobile} />
          </SidebarContent>
        </>
      );
    }
  }, [isIndexRoute, isStreamRoute, isMobile, stream, rules, streamId]);

  if (!isIndexRoute && !isStreamRoute) {
    return null;
  }

  return (
    <Sidebar className="border-r-0 w-75" {...props}>
                <SidebarHeader className="p-4 pb-3 border-b border-border/60">
            <div className="flex flex-col gap-6 w-full">
              {/* Back to Projects */}
              <Button variant="ghost" 
              
              
              className="w-max text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 justify-start px-2 -ml-2 h-7" 
              
              asChild>
                <Link to="/"
                >
                  <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2.5} className="size-3.5" />
                  <span>Back to Blueprints</span>
                </Link>
              </Button>
              
              {/* Application Logo & Name */}
              <div className="flex items-center gap-2.5 font-bold tracking-tight text-xl mt-1">
                <div className="bg-primary/10 p-1.5 border border-primary shadow-sm shrink-0">
                  <HugeiconsIcon icon={Target01Icon} className="text-primary size-5" strokeWidth={2.5} />
                </div>
                <span className="bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none truncate">Threat Lens</span>
              </div>

              {/* System Status Widget */}
              <div className="bg-muted/30 rounded border border-border/50 p-3 py-2 flex items-center justify-between shadow-inner mt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">System</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full  opacity-60 bg-primary"></span>
                    <span className="relative inline-flex  h-full w-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                  </span>
                  Online
                </span>
              </div>
            </div>
          </SidebarHeader>
      {renderContent}
    </Sidebar>
  );
}
