import * as React from "react";
import { DatePicker } from "@/components/date-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UploadBlueprintDialog } from "./upload-blueprint-dialog";

import { useQuery } from "@tanstack/react-query";
import { eventsQueries } from "@/lib/queries";
import { useMatchRoute } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { RightSidePanelAlerts } from "./right-sidepanel-alerts";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const isStreamRoute = matchRoute({ to: "/stream/$id" });
  const streamId = isStreamRoute ? (isStreamRoute as any).id : null;

  // URL State for Date Filtering (using nuqs)
  const [fromDate] = useQueryState("from");
  const [toDate] = useQueryState("to");

  // Fetch events based on current context and date filters
  const { data: events } = useQuery({
    ...eventsQueries.list({
      stream_id: streamId,
      from: fromDate || null,
      to: toDate || null,
    }),
  });

  // Separate events into Active and Resolved
  const activeEvents = React.useMemo(() => {
    return (events || []).filter((e) => e.status !== "resolved");
  }, [events]);

  const resolvedEvents = React.useMemo(() => {
    return (events || []).filter((e) => e.status === "resolved");
  }, [events]);
  


  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex w-85"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-14 border-b"></SidebarHeader>
      <SidebarContent className="p-2.5">
        <DatePicker />
       <RightSidePanelAlerts events={events} activeEvents={activeEvents} resolvedEvents={resolvedEvents} /> 
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="hidden"></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
