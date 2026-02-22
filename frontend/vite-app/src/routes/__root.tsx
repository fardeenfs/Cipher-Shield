import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TopBar } from "@/components/top-bar";

export const Route = createRootRoute({
  component: RootComponent,
});
const queryClient = new QueryClient()

function RootComponent() {
  return (
    <React.Fragment>
      <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
          {/* <TopBar /> */}
          <div className="relative flex-1 overflow-hidden">
            <SidebarProvider className="h-full min-h-full min-w-0">
              <SidebarLeft />
              <SidebarInset className="flex h-full flex-col overflow-hidden">
                <Outlet />
              </SidebarInset>
              <SidebarRight />
            </SidebarProvider>
          </div>
        </div>
      </TooltipProvider>
      </QueryClientProvider>
      </NuqsAdapter>
    </React.Fragment>
  );
}
