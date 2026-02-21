import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <TooltipProvider>
        <SidebarProvider>
          <SidebarLeft />
          <SidebarInset className="flex h-svh flex-col overflow-hidden">
            <Outlet />
          </SidebarInset>
          <SidebarRight />
        </SidebarProvider>
      </TooltipProvider>
    </React.Fragment>
  );
}
