"use client";

import * as React from "react";

import { NavCamera } from "@/components/nav-camera";
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
import { useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rulesQueries, streamsQueries } from "@/lib/queries";
import { StreamActivityCard } from "./stream-activity-card";
import { ActiveRulesCard } from "./active-rules-card";


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
          <SidebarHeader className="gap-4 border-sidebar-border h-14 border-b"></SidebarHeader>
          <SidebarContent className="gap-4 p-2.5">
            <NavCamera />
            {/* <NavPrompts prompts={prompts} /> */}
          </SidebarContent>
          <SidebarRail />
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <AddCameraDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      );
    }
    if (isStreamRoute) {
      return (
        <>
          <SidebarHeader className="gap-4 border-sidebar-border h-14 border-b"></SidebarHeader>
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
      {renderContent}
    </Sidebar>
  );
}
