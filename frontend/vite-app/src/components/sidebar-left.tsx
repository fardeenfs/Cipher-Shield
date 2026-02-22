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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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
  PauseIcon,
  MoreHorizontalCircle01Icon,
  Edit,
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
import { useLocation, useMatchRoute } from "@tanstack/react-router";
import { Badge } from "./ui/badge";
import { SegmentedBar } from "./segmented-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";
const activeRules = [
  {
    id: "rule-1",
    name: "Till Accessed",
    description: "Alert if a hand reaches into the open cash register.",
  },
  {
    id: "rule-2",
    name: "Counter Breach",
    description: "Alert if a person walks behind the service counter.",
  },
];

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar();

  // const [prompts, setPrompts] = React.useState<string[]>([]);
  // const [inputText, setInputText] = React.useState("");

  // const handleSave = () => {
  //   if (inputText.trim() !== "") {
  //     setPrompts([...prompts, inputText]);
  //     setInputText("");
  //   }
  // };
  const matchRoute = useMatchRoute();

  const isIndexRoute = matchRoute({ to: "/" });
  const isStreamRoute = matchRoute({ to: "/stream/$id" });

  const renderContent = React.useMemo(() => {
    if (isIndexRoute) {
      return (
        <>
          <SidebarHeader className="gap-4 border-sidebar-border h-14 border-b"></SidebarHeader>
          <SidebarContent className="gap-4">
            <NavCamera />
            {/* <NavPrompts prompts={prompts} /> */}
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
        </>
      );
    }
    if (isStreamRoute) {
      return (
        <>
          <SidebarHeader className="gap-4 border-sidebar-border h-14 border-b"></SidebarHeader>
          <SidebarContent className="gap-4 p-2.5">
            {/* HUD Container */}
            <Card size="sm">
              {/* Header */}
              <CardHeader className="p-5 pb-6">
                <CardTitle className="flex items-center gap-3 ">
                  <div className="size-2.5 bg-blue-500" />
                  Stream Activity
                </CardTitle>
              </CardHeader>

              {/* Content Area */}
              <CardContent className="p-5 pt-0">
                {/* Top Stats Row */}
                <div className="mb-8 grid grid-cols-3 text-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xl text-white">2</span>
                    <span className="text-[10px] text-gray-500">High</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl text-white">23</span>
                    <span className="text-[10px] text-gray-500">Medium</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl text-white">0</span>
                    <span className="text-[10px] text-gray-500">Low</span>
                  </div>
                </div>

                {/* Engagement Bars */}
                <div className="flex flex-col gap-5">
                  <SegmentedBar label="High Priority Rules" percentage={10} />
                  <SegmentedBar label="Medium Priority Rules" percentage={92} />
                  <SegmentedBar label="Low Priority Rules" percentage={0} />
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader className="p-5 pb-6">
                <CardTitle className="flex items-center gap-3 ">
                  <div className="size-2.5 bg-green-500" />
                  Camera 01
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-5 p-5 pt-0">
                <div className="flex flex-col gap-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Active Logic Rules</span>
                    <span>{activeRules.length}</span>
                  </div>

                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {activeRules.map((rule) => (
                      <SidebarMenuItem key={rule.id} className="relative">
                        <Item variant="outline" asChild role="listitem">
                          <ItemContent className="flex w-full flex-col items-start gap-1 pr-6">
                            <ItemTitle>{rule.name}</ItemTitle>
                            <ItemDescription className="line-clamp-1 text-muted-foreground">
                              {rule.description}
                            </ItemDescription>
                          </ItemContent>
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
                              <span>Disable</span>
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
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-transparent text-xs hover:bg-white/10 hover:text-white"
                >
                  <span className="mr-2 text-lg leading-none">+</span> Add Logic
                  Rule
                </Button>
              </CardContent>
            </Card>
          </SidebarContent>
        </>
      );
    }
  }, [isIndexRoute, isStreamRoute, isMobile]);

  if (!isIndexRoute && !isStreamRoute) {
    return null;
  }

  return (
    <Sidebar className="border-r-0 w-75" {...props}>
      {renderContent}
    </Sidebar>
  );
}
