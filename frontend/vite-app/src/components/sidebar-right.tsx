import * as React from "react";

import { Calendars } from "@/components/calendars";
import { DatePicker } from "@/components/date-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TimelineItem } from "./timeline-item";
import { Badge } from "./ui/badge";
import { ScrollBlur } from "./scroll-blur";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
};
const entries = [
  {
    id: "1",
    date: "January 2024",
    title: "First Light",
    description:
      "The year begins with golden light spilling across the hills, a reminder that every dawn carries the promise of something new.",
    image: "https://avatar.vercel.sh/timeline-1.jpg",
    imageAlt: "Golden sunrise over rolling hills with misty valleys",
  },
  {
    id: "2",
    date: "March 2024",
    title: "Canopy of Change",
    description:
      "Spring stirs beneath the canopy, painting the forest in vivid hues. From above, the landscape transforms into an impressionist canvas.",
    image: "https://avatar.vercel.sh/timeline-2.jpg",
    imageAlt: "Aerial view of autumn forest canopy with orange and red leaves",
  },
  {
    id: "3",
    date: "June 2024",
    title: "Structure & Light",
    description:
      "Clean lines meet warm afternoon light. Architecture becomes a meditation on space, shadow, and the passage of hours.",
    image: "https://avatar.vercel.sh/timeline-3.jpg",
    imageAlt: "Minimalist architecture with concrete and glass in warm light",
  },
  {
    id: "4",
    date: "August 2024",
    title: "Where Water Meets Stone",
    description:
      "The ocean does not rest. Waves crash endlessly against volcanic rock, carving patience into the coastline one surge at a time.",
    image: "https://avatar.vercel.sh/timeline-4.jpg",
    imageAlt: "Ocean waves crashing on dark volcanic rocks",
  },
  {
    id: "5",
    date: "October 2024",
    title: "Silent Expanse",
    description:
      "As autumn deepens, the desert offers its own quiet spectacle. Dunes ripple beneath a sky that shifts from amber to violet.",
    image: "https://avatar.vercel.sh/timeline-5.jpg",
    imageAlt: "Desert sand dunes at twilight with orange and purple sky",
  },
  {
    id: "6",
    date: "December 2024",
    title: "The Summit",
    description:
      "The year closes at altitude. Snow-dusted peaks catch the first blush of dawn, standing in silent testament to the journey taken.",
    image: "https://avatar.vercel.sh/timeline-6.jpg",
    imageAlt: "Snow-covered mountain peak at dawn with pink and orange clouds",
  },
];
export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-14 border-b"></SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />

        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="flex justify-between items-center">
            All alerts
            <Badge variant="outline">{entries.length}</Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollBlur className="max-h-120">
              <div className="relative w-full mt-1">
                <div className="flex flex-col">
                  {entries.map((entry, index) => (
                    <TimelineItem
                      key={entry.id}
                      entry={entry}
                      index={index}
                      isLast={index === entries.length - 1}
                    />
                  ))}
                </div>
              </div>
            </ScrollBlur>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
