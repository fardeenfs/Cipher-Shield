"use client";

import * as React from "react";

import { NavCamera } from "@/components/nav-camera";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CommandIcon,
  AudioWave01Icon,
  SearchIcon,
  SparklesIcon,
  HomeIcon,
  InboxIcon,
  CalendarIcon,
  Settings05Icon,
  CubeIcon,
  Delete02Icon,
  MessageQuestionIcon,
  PlusSignIcon,
  BluetoothIcon,
  Search,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Textarea } from "./ui/textarea";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <HugeiconsIcon icon={AudioWave01Icon} strokeWidth={2} />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />,
    },
    {
      title: "Home",
      url: "#",
      icon: <HugeiconsIcon icon={HomeIcon} strokeWidth={2} />,
      isActive: true,
    },
    {
      title: "Inbox",
      url: "#",
      icon: <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "#",
      icon: <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      title: "Templates",
      url: "#",
      icon: <HugeiconsIcon icon={CubeIcon} strokeWidth={2} />,
    },
    {
      title: "Trash",
      url: "#",
      icon: <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />,
    },
    {
      title: "Help",
      url: "#",
      icon: <HugeiconsIcon icon={MessageQuestionIcon} strokeWidth={2} />,
    },
  ],
  cameras: [
    {
      name: "Camera 1",
      description: "Some description",
    },
    {
      name: "Camera 2",
      description: "Some description",
    },
    {
      name: "Camera 3",
      description: "Some description",
    },
  ],
  workspaces: [
    {
      name: "Personal Life Management",
      emoji: "🏠",
      pages: [
        {
          name: "Daily Journal & Reflection",
          url: "#",
          emoji: "📔",
        },
        {
          name: "Health & Wellness Tracker",
          url: "#",
          emoji: "🍏",
        },
        {
          name: "Personal Growth & Learning Goals",
          url: "#",
          emoji: "🌟",
        },
      ],
    },
    {
      name: "Professional Development",
      emoji: "💼",
      pages: [
        {
          name: "Career Objectives & Milestones",
          url: "#",
          emoji: "🎯",
        },
        {
          name: "Skill Acquisition & Training Log",
          url: "#",
          emoji: "🧠",
        },
        {
          name: "Networking Contacts & Events",
          url: "#",
          emoji: "🤝",
        },
      ],
    },
    {
      name: "Creative Projects",
      emoji: "🎨",
      pages: [
        {
          name: "Writing Ideas & Story Outlines",
          url: "#",
          emoji: "✍️",
        },
        {
          name: "Art & Design Portfolio",
          url: "#",
          emoji: "🖼️",
        },
        {
          name: "Music Composition & Practice Log",
          url: "#",
          emoji: "🎵",
        },
      ],
    },
    {
      name: "Home Management",
      emoji: "🏡",
      pages: [
        {
          name: "Household Budget & Expense Tracking",
          url: "#",
          emoji: "💰",
        },
        {
          name: "Home Maintenance Schedule & Tasks",
          url: "#",
          emoji: "🔧",
        },
        {
          name: "Family Calendar & Event Planning",
          url: "#",
          emoji: "📅",
        },
      ],
    },
    {
      name: "Travel & Adventure",
      emoji: "🧳",
      pages: [
        {
          name: "Trip Planning & Itineraries",
          url: "#",
          emoji: "🗺️",
        },
        {
          name: "Travel Bucket List & Inspiration",
          url: "#",
          emoji: "🌎",
        },
        {
          name: "Travel Journal & Photo Gallery",
          url: "#",
          emoji: "📸",
        },
      ],
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <div className="relative">
          <HugeiconsIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            icon={Search}
            strokeWidth={2}
          />
          <Input type="search" placeholder="Search..." className="pl-9" />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Add Camera
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <HugeiconsIcon icon={BluetoothIcon} strokeWidth={2} />
              </AlertDialogMedia>
              <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to allow the USB accessory to connect to this
                device?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
              <AlertDialogAction>Allow</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarHeader>
      <SidebarContent>
        <NavCamera cameras={data.cameras} />

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Gloal Prompt</CardTitle>
            <CardDescription>Please fill the global prompt</CardDescription>
            <CardAction></CardAction>
          </CardHeader>
          <CardContent>
            <Textarea />
          </CardContent>
        </Card>
        {/* <NavWorkspaces workspaces={data.workspaces} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
