import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { TopBar } from "@/components/top-bar";
import DynamicIsland from '@/components/dynamic-island';

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-card">
        <div className="relative flex-1 overflow-hidden">
          <SidebarProvider className="h-full min-h-full min-w-0">
            <SidebarLeft />
            <SidebarInset className="flex h-full flex-col overflow-hidden relative pt-14">
              <div className="fixed top-0 right-0 z-100 transition-[left] duration-200 ease-linear left-[calc(var(--sidebar-width)+2.8rem)]">
                <TopBar />
              </div>
              <Outlet />
            </SidebarInset>
            <SidebarRight />
          </SidebarProvider>
        </div>
      </div>
      <div className=" absolute bottom-6 left-1/2 -translate-x-1/2 z-99">
        <DynamicIsland />
      </div>
    </>
  )
}
