import { useState, useMemo } from "react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalCircle01Icon,
  Delete02Icon,
  Search,
  CheckmarkBadge01Icon,
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
import { blueprintsQueries, blueprintsMutations } from "@/lib/queries";
import type { BlueprintSummary } from "@/lib/services";
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
import { UploadBlueprintDialog } from "./upload-blueprint-dialog";

export function NavBlueprint() {
  const queryClient = useQueryClient();
  const { data: blueprints = [], isLoading } = useQuery(blueprintsQueries.list());
  const { isMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlueprint, setSelectedBlueprint] = useQueryState("blueprint");

  const deleteBlueprintMutation = useMutation(blueprintsMutations.delete(queryClient));
  
  const filteredBlueprints = useMemo(() => {
    if (!searchQuery.trim()) return blueprints;
    const query = searchQuery.toLowerCase();
    
    return blueprints.filter((blueprint) => {
      return (
        blueprint.name.toLowerCase().includes(query) ||
        blueprint.id.toLowerCase().includes(query)
      );
    });
  }, [blueprints, searchQuery]);

  return (
    <Card size="sm" className="group-data-[collapsible=icon]:hidden">
      <CardHeader className="p-5 pb-6">
        <CardTitle className="flex items-center gap-3">
          <div className="size-2.5 bg-primary-foreground shadow-[0_0_5px_var(--primary-foreground)]" />
          Available Blueprints
          <Badge variant="outline" className="ml-auto">{filteredBlueprints.length}</Badge>
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
          <UploadBlueprintDialog />
        </div>
        <SidebarGroup className="px-0 py-0">
          <ScrollBlur className="max-h-100">
            <SidebarMenu className="space-y-2">
          {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading blueprints...</div>}
          {!isLoading && filteredBlueprints.length === 0 && (
             <div className="p-4 text-center text-xs text-muted-foreground">No blueprints match your search.</div>
          )}
          {filteredBlueprints.map((blueprint) => (
            <BlueprintListItem
              key={blueprint.id}
              blueprint={blueprint}
              deleteMutation={deleteBlueprintMutation}
              isMobile={isMobile}
              isSelected={selectedBlueprint === blueprint.id || (!selectedBlueprint && blueprint.id === filteredBlueprints[0]?.id)}
              onSelect={() => setSelectedBlueprint(blueprint.id)}
            />
          ))}
        </SidebarMenu>
      </ScrollBlur>
    </SidebarGroup>
    </CardContent>
    </Card>
  );
}

function BlueprintListItem({
  blueprint,
  deleteMutation,
  isMobile,
  isSelected,
  onSelect,
}: {
  blueprint: BlueprintSummary;
  deleteMutation: any;
  isMobile: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { data: blueprintDetails } = useQuery({
    ...blueprintsQueries.detail(blueprint.id),
    enabled: !!blueprint.id,
  });

  const displayImage = blueprintDetails?.image_base64
    ? `data:image/jpeg;base64,${blueprintDetails.image_base64}`
    : `https://avatar.vercel.sh/${blueprint.id}`;

  return (
    <SidebarMenuItem>
      <AlertDialog>
        <Item
          variant="outline"
          onClick={onSelect}
          asChild
          role="listitem"
          className={cn(
            "w-full cursor-pointer transition-colors",
            isSelected ? "bg-accent/50 border-primary shadow-sm" : "hover:bg-accent/30"
          )}
        >
          <div className="flex items-center gap-3">
            <ItemMedia variant="image" className={cn(isSelected && "ring-2 ring-primary ring-offset-1")}>
              <img
                src={displayImage}
                alt={blueprint.name}
                width={32}
                height={32}
                className="object-cover rounded-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${blueprint.id}`;
                }}
              />
            </ItemMedia>

            <ItemContent className="flex-col items-start gap-1">
              <ItemTitle className="flex items-center gap-2">
                <span className="font-medium cursor-pointer">
                  {blueprint.name}
                </span>
                {isSelected && (
                  <span className="relative flex h-2 w-2 shrink-0 ml-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                  </span>
                )}
              </ItemTitle>

              <ItemDescription className="line-clamp-1 text-muted-foreground">
                {new Date(blueprint.created_at || "").toLocaleDateString()}
              </ItemDescription>
            </ItemContent>
          </div>
        </Item>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction className="aria-expanded:bg-muted">
              <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem onClick={onSelect}>
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                strokeWidth={2}
                className="text-muted-foreground"
              />
              <span>Select</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
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
              This will permanently delete the blueprint "{blueprint.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(blueprint.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  );
}
