import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const Route = createRootRoute({
  component: RootComponent,
});
const queryClient = new QueryClient()

function RootComponent() {
  return (
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <SidebarLeft />
          <SidebarInset className="flex h-svh flex-col overflow-hidden">
            <Outlet />
          </SidebarInset>
          <SidebarRight />
        </SidebarProvider>
      </TooltipProvider>
      </QueryClientProvider>
    </React.Fragment>
  );
}
