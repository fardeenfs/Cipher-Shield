import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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
} from "@hugeicons/core-free-icons";
import { CardDescription, CardHeader, CardTitle } from "./ui/card";

export function NavCamera({
  cameras,
}: {
  cameras: {
    name: string;
    description: string;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Available Cameras</SidebarGroupLabel>
      <SidebarMenu className="space-y-2 overflow-y-scroll max-h-80">
        {cameras.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild variant="outline" size="lg">
              <CardHeader className="w-full! items-start  flex-col -gap-1">
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </SidebarMenuButton>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="aria-expanded:bg-muted"
                >
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
                    icon={StarOffIcon}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                  <span>Remove from Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <HugeiconsIcon
                    icon={LinkIcon}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HugeiconsIcon
                    icon={ArrowUpRightIcon}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                  <span>Open in New Tab</span>
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
            </DropdownMenu> */}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
