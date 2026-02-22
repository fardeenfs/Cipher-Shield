import { useState, useMemo } from "react";
import * as motion from "motion/react-client";
import type { Variants } from "motion/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalCircle01Icon,
  Delete02Icon,
  Search,
  Edit,
  PauseIcon,
  PlayIcon,
  Unlink01Icon,
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
import { useQueryState } from "nuqs";
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
import { AddCameraDialog } from "./add-camera-dialog";

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

export function NavCamera() {
  const queryClient = useQueryClient();
  const { data: cameras = [], isLoading } = useQuery(streamsQueries.list());
  const { isMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  const [, setSelectedBlueprint] = useQueryState("blueprint");
  const [selectedCameraId, setSelectedCamera] = useQueryState("camera");
  const deleteStreamMutation = useMutation(streamsMutations.delete(queryClient));
  const enableMutation = useMutation(streamsMutations.enable(queryClient));
  const disableMutation = useMutation(streamsMutations.disable(queryClient));
  const delinkMutation = useMutation(streamsMutations.update(queryClient));
  
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

  const allFilteredCameras = useMemo(() => {
    let result = cameras;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((camera) => {
        return (
          camera.name.toLowerCase().includes(query) ||
          camera.source_url.toLowerCase().includes(query) ||
          camera.id.toLowerCase().includes(query) ||
          camera.source_type.toLowerCase().includes(query)
        );
      });
    }
    return result;
  }, [cameras, searchQuery]);

const unusedFilteredCameras = useMemo(() => {
  return allFilteredCameras.filter((c) => !c.blueprint_id || c.blueprint_id === "null");
}, [allFilteredCameras]);

  return (
    <Card size="sm" className="group-data-[collapsible=icon]:hidden">
      <CardHeader className="p-5 pb-6">
        <CardTitle className="flex items-center gap-3">
          <div className="size-2.5 bg-primary shadow-[0_0_5px_var(--primary)]" />
          Cameras
          <Badge variant="outline" className="ml-auto">{allFilteredCameras.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <HugeiconsIcon
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              icon={Search}
              strokeWidth={2}
            />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pl-9 w-full" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        <AddCameraDialog />
        </div>
        
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="unused" className="flex-1">Unassigned</TabsTrigger>
            </TabsList>

          <TabsContent value="all" className="m-0 border-none p-0 outline-none">
            <CameraList 
              cameras={allFilteredCameras} 
              isLoading={isLoading} 
              onDragStart={onDragStart} 
              isMobile={isMobile} 
              deleteStreamMutation={deleteStreamMutation} 
              enableMutation={enableMutation} 
              disableMutation={disableMutation} 
              delinkMutation={delinkMutation}
              onSelectBlueprint={setSelectedBlueprint}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCamera}
            />
          </TabsContent>
          <TabsContent value="unused" className="m-0 border-none p-0 outline-none">
            <CameraList 
              cameras={unusedFilteredCameras} 
              isLoading={isLoading} 
              onDragStart={onDragStart} 
              isMobile={isMobile} 
              deleteStreamMutation={deleteStreamMutation} 
              enableMutation={enableMutation} 
              disableMutation={disableMutation} 
              delinkMutation={delinkMutation}
              onSelectBlueprint={setSelectedBlueprint}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCamera}
            />
          </TabsContent>
        </Tabs>
    </CardContent>
    </Card>
  );
}

function CameraList({ 
  cameras, 
  isLoading, 
  onDragStart, 
  isMobile, 
  deleteStreamMutation, 
  enableMutation, 
  disableMutation,
  delinkMutation,
  onSelectBlueprint,
  selectedCameraId,
  onSelectCamera,
}: any) {
  return (
    <SidebarGroup className="px-0 py-0">
          <ScrollBlur className="max-h-50">
        <SidebarMenu className="space-y-2 pb-4">
      {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading cameras...</div>}
      {!isLoading && cameras.length === 0 && (
         <div className="p-4 text-center text-xs text-muted-foreground">No cameras found.</div>
      )}
      {cameras.map((camera: Stream) => {
        return (
        <motion.div
          key={camera.id}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ amount: "some" }}
          variants={cardVariants}
        >
          <SidebarMenuItem>
            <AlertDialog>
            <Item
              draggable // Enable native dragging
              onDragStart={(e) => onDragStart(e, camera)}
              onClick={() => {
                if (camera.blueprint_id) {
                onSelectCamera(camera.id);
                }
                if (camera.blueprint_id && camera.blueprint_id !== "null" && camera.blueprint_id !== null) {
                  onSelectBlueprint(camera.blueprint_id);
                }
              }}
              variant="outline"
              asChild
              role="listitem"
              className={cn(
                "w-full transition-colors",
                camera.blueprint_id ? "cursor-pointer" : "cursor-grab",
                selectedCameraId === camera.id 
                  ? "bg-accent/50 border-primary" 
                  : "hover:bg-accent/10"
              )}
            >
              <div className="flex items-center gap-3">
                <ItemMedia variant="image" >
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

                <ItemContent className="flex-col items-start gap-1 min-w-0 flex-1">
                  <ItemTitle className="flex items-center justify-between gap-2 w-full">
                    <Link
                      to="/stream/$id"
                      params={{ id: camera.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium min-w-0 flex-1 truncate block hover:underline hover:decoration-foreground hover:decoration-2 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
                    >
                      {camera.name}
                    </Link>

                    {/* Pulse */}
                    <span className="relative flex h-2 w-2 shrink-0 mr-6">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full opacity-60", camera.enabled ? "bg-primary" : "bg-destructive")}></span>
                      <span className={cn("relative inline-flex h-2 w-2", camera.enabled ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-destructive shadow-[0_0_8px_var(--color-destructive)]")}></span>
                    </span>
                  </ItemTitle>

                  <ItemDescription className="truncate w-full text-muted-foreground block text-left">
                    {camera.source_url}
                  </ItemDescription>
                </ItemContent>
              </div>
            </Item>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction className="aria-expanded:bg-muted mt-0.5">
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

                <DropdownMenuItem 
                  disabled={!camera.blueprint_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (camera.blueprint_id) {
                      delinkMutation.mutate({
                        id: camera.id,
                        payload: {
                          blueprint_id: null,
                          position_x: 0,
                          position_y: 0,
                        }
                      });
                    }
                  }}
                >
                  <HugeiconsIcon
                    icon={Unlink01Icon}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                  <span>Remove from blueprint</span>
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
                      className="text-destructive"
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
                  This will permanently delete the stream "{camera.name}". This action cannot be undone.
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
        </motion.div>
      );
      })}
    </SidebarMenu>
  </ScrollBlur>
</SidebarGroup>
  );
}
