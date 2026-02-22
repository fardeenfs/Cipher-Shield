import { useState, useMemo } from "react";
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
  PlayIcon,
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
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { streamsQueries, streamsMutations } from "@/lib/queries";
import type { Stream } from "@/lib/services";
import { cn } from "@/lib/utils";
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

export function NavCamera() {
  const queryClient = useQueryClient();
  const { data: cameras = [], isLoading } = useQuery(streamsQueries.list());
  const { isMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  const deleteStreamMutation = useMutation(streamsMutations.delete(queryClient));
  const enableMutation = useMutation(streamsMutations.enable(queryClient));
  const disableMutation = useMutation(streamsMutations.disable(queryClient));
  
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

  const filteredCameras = useMemo(() => {
    if (!searchQuery.trim()) return cameras;
    const query = searchQuery.toLowerCase();
    
    return cameras.filter((camera) => {
      // Fuzzy search across multiple fields
      return (
        camera.name.toLowerCase().includes(query) ||
        camera.source_url.toLowerCase().includes(query) ||
        camera.id.toLowerCase().includes(query) ||
        camera.source_type.toLowerCase().includes(query)
      );
    });
  }, [cameras, searchQuery]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex justify-between items-center">
        Available Cameras
        <Badge variant="outline">{filteredCameras.length}</Badge>
      </SidebarGroupLabel>
      <div className="relative my-2">
        <HugeiconsIcon
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          icon={Search}
          strokeWidth={2}
        />
        <Input 
          type="search" 
          placeholder="Search..." 
          className="pl-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollBlur className="max-h-100">
        <SidebarMenu className="space-y-2">
          {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading streams...</div>}
          {!isLoading && filteredCameras.length === 0 && (
             <div className="p-4 text-center text-xs text-muted-foreground">No cameras match your search.</div>
          )}
          {filteredCameras.map((camera) => (
            <SidebarMenuItem key={camera.id}>
              <AlertDialog>
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
                        src={`http://localhost:8080/api/streams/${camera.id}/live`}
                        alt={camera.name}
                        width={32}
                        height={32}
                        className="object-cover grayscale rounded-none"
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
                          className="font-medium hover:underline hover:decoration-foreground hover:decoration-2 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
                        >
                          {camera.name}
                        </Link>

                        {/* Pulse */}
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", camera.enabled ? "bg-primary" : "bg-destructive")}></span>
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", camera.enabled ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-destructive shadow-[0_0_8px_var(--color-destructive)]")}></span>
                        </span>
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
                    className="w-56"
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

                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (camera.enabled) {
                          disableMutation.mutate(camera.id);
                        } else {
                          enableMutation.mutate(camera.id);
                        }
                      }}
                    >
                      <HugeiconsIcon
                        icon={camera.enabled ? PauseIcon : PlayIcon}
                        strokeWidth={2}
                        className="text-muted-foreground"
                      />
                      <span>{camera.enabled ? "Disable" : "Enable"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault(); // Prevent DropdownMenu from immediately closing so the trigger fires properly
                        }}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="text-muted-foreground text-destructive"
                        />
                        <span className="text-destructive">Delete</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the stream "{camera.name}" from our servers. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteStreamMutation.mutate(camera.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </ScrollBlur>
    </SidebarGroup>
  );
}
