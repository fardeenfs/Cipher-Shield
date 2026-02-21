import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalCircle01Icon,
  StarOffIcon,
  LinkIcon,
  ArrowUpRightIcon,
  Delete02Icon,
  Search,
  Edit,
  DisabilityFreeIcons,
  PauseIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { ScrollBlur } from "./scroll-blur";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { streamsQueries } from "@/lib/queries";
import type { Stream } from "@/lib/services";

export function NavCamera() {
  const { data: cameras = [], isLoading } = useQuery(streamsQueries.list());
  const { isMobile } = useSidebar();
  
  const onDragStart = (
    event: React.DragEvent,
    cameraData: Stream,
  ) => {
    // Store the camera info so the canvas knows what kind of node to create
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(cameraData),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex justify-between items-center">
        Available Cameras
        <Badge variant="outline">{cameras.length}</Badge>
      </SidebarGroupLabel>
      <div className="relative my-2">
        <HugeiconsIcon
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          icon={Search}
          strokeWidth={2}
        />
        <Input type="search" placeholder="Search..." className="pl-9" />
      </div>
      <ScrollBlur className="max-h-100">
        <SidebarMenu className="space-y-2">
          {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading streams...</div>}
          {cameras.map((camera) => (
            <SidebarMenuItem key={camera.id}>
              <Item
                draggable // Enable native dragging
                onDragStart={(e) => onDragStart(e, camera)}
                variant="outline"
                asChild
                role="listitem"
                className="w-full"
              >
                <div className="flex items-center gap-3">
                  <ItemMedia variant="image">
                    <img
                      src={`http://localhost:8080/api/streams/${camera.id}/snapshot`}
                      alt={camera.name}
                      width={32}
                      height={32}
                      className="object-cover grayscale rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${camera.id}`;
                      }}
                    />
                  </ItemMedia>

                  <ItemContent className="flex-col items-start gap-1">
                    <ItemTitle className="flex items-center gap-2">
                      <Link
                        to="/stream/$id"
                        params={{ id: camera.id }}
                        className="font-medium hover:underline hover:decoration-foreground hover:decoration-2 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {camera.name}
                      </Link>

                      {/* Pulse */}
                      {camera.enabled && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                        </span>
                      )}
                    </ItemTitle>

                    <ItemDescription className="line-clamp-1 text-muted-foreground">
                      {camera.source_url}
                    </ItemDescription>
                  </ItemContent>
                </div>
              </Item>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction className="aria-expanded:bg-muted">
                    <HugeiconsIcon
                      icon={MoreHorizontalCircle01Icon}
                      strokeWidth={2}
                    />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <HugeiconsIcon
                      icon={Edit}
                      strokeWidth={2}
                      className="text-muted-foreground"
                    />
                    <span>Edit</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <HugeiconsIcon
                      icon={PauseIcon}
                      strokeWidth={2}
                      className="text-muted-foreground"
                    />
                    <span>{camera.enabled ? "Disable" : "Enable"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="text-muted-foreground"
                    />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </ScrollBlur>
    </SidebarGroup>
  );
}
