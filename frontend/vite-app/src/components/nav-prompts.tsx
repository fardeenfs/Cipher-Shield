import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Item, ItemContent, ItemDescription } from "@/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ScrollBlur } from "./scroll-blur";

export function NavPrompts({ prompts }: { prompts: string[] }) {
  if (prompts.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Global detection</SidebarGroupLabel>
      <ScrollBlur className="max-h-50">
        <SidebarMenu className="space-y-2">
          {/* Wrap the list in a TooltipProvider */}
          <TooltipProvider delayDuration={300}>
            {prompts.map((prompt, index) => (
              <SidebarMenuItem key={index}>
                <Item
                  variant="muted"
                  size="xs"
                  role="listitem"
                  className="w-full"
                >
                  <ItemContent className="w-full">
                    <Tooltip>
                      {/* 1. Add asChild so it doesn't render an extra <button> */}
                      <TooltipTrigger asChild>
                        {/* 2. Wrap in a div to preserve full width and text alignment */}
                        <div className="w-full text-left cursor-default">
                          <ItemDescription className="line-clamp-2 text-sm">
                            {prompt}
                          </ItemDescription>
                        </div>
                      </TooltipTrigger>

                      {/* 3. Set side="right" and add text wrapping classes */}
                      <TooltipContent
                        side="right"
                        align="start"
                        className="max-w-62.5 whitespace-normal wrap-break-word"
                      >
                        {prompt}
                      </TooltipContent>
                    </Tooltip>
                  </ItemContent>
                </Item>
              </SidebarMenuItem>
            ))}
          </TooltipProvider>
        </SidebarMenu>
      </ScrollBlur>
    </SidebarGroup>
  );
}
