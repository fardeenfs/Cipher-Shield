"use client";

import * as React from "react";

import { NavCamera } from "@/components/nav-camera";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Textarea } from "./ui/textarea";
import { NavPrompts } from "./nav-prompts";
import { AddCameraDialog } from "./add-camera-dialog";

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
    {
      name: "Camera 4",
      description: "Some description",
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  // const [prompts, setPrompts] = React.useState<string[]>([]);
  // const [inputText, setInputText] = React.useState("");

  // const handleSave = () => {
  //   if (inputText.trim() !== "") {
  //     setPrompts([...prompts, inputText]);
  //     setInputText("");
  //   }
  // };
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="gap-4 border-sidebar-border h-14 border-b"></SidebarHeader>
      <SidebarContent className="gap-4">
        <NavCamera cameras={data.cameras} />
        {/* <NavPrompts prompts={prompts} /> */}
        {/* <NavWorkspaces workspaces={data.workspaces} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarRail />
      {/* <SidebarFooter>
        <Card className="w-full max-w-md" size="sm">
          <CardHeader>
            <CardTitle>Global Prompt</CardTitle>
            <CardDescription>Please fill the global prompt</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your prompt here..."
            />
            <div className="mt-4">
              <Button onClick={handleSave}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </SidebarFooter> */}

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AddCameraDialog />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
