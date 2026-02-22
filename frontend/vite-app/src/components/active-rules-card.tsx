import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rulesMutations } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SidebarMenuItem, SidebarMenuAction } from "./ui/sidebar";
import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalCircle01Icon, Edit, PauseIcon, Delete02Icon, TextSquareIcon, Alert01Icon } from "@hugeicons/core-free-icons";
import { ScrollBlur } from "./scroll-blur";
import { AddRuleDialog } from "./add-rule-dialog";
import type { StreamRule } from "@/lib/services";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ActiveRulesCardProps {
  streamId: string;
  streamName: string;
  rules: StreamRule[] | undefined;
  isMobile: boolean;
}

export function ActiveRulesCard({ streamId, streamName, rules, isMobile }: ActiveRulesCardProps) {
  const queryClient = useQueryClient();
  const deleteRule = useMutation(rulesMutations.delete(queryClient, streamId));
  const updateRule = useMutation(rulesMutations.update(queryClient, streamId));

  const [editingRule, setEditingRule] = useState<StreamRule | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editThreatLevel, setEditThreatLevel] = useState("medium");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  const handleEditClick = (rule: StreamRule) => {
    setEditingRule(rule);
    setEditDescription(rule.description);
    setEditThreatLevel(rule.threat_level);
    setApiErrorMsg("");
  };

  const handleDeleteClick = (ruleId: string) => {
    deleteRule.mutate(ruleId);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMsg("");

    if (!editDescription || !editingRule) return;

    updateRule.mutate(
      {
        ruleId: editingRule.id,
        payload: {
          description: editDescription,
          threat_level: editThreatLevel as "none" | "low" | "medium" | "high",
        },
      },
      {
        onSuccess: () => {
          setEditingRule(null);
        },
        onError: (error) => {
          console.error("Failed to update rule:", error);
          setApiErrorMsg(error.message);
        },
      }
    );
  };

  return (
    <>
      <Card size="sm">
        <CardHeader className="p-5 pb-6">
          <CardTitle className="flex items-center gap-3 ">
            <div className="size-2.5 bg-primary shadow-[0_0_5px_var(--primary)]" />
            {streamName}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 p-5 pt-0">
          <div className="flex flex-col gap-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
              <span>Active Logic Rules</span>
              <span>{rules?.length || 0}</span>
            </div>

            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              <ScrollBlur className="max-h-60">
                {!rules?.length && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No active rules found.
                  </div>
                )}
                {rules?.map((rule) => (
                  <SidebarMenuItem key={rule.id} className="relative">
                    <Item variant="outline" asChild role="listitem">
                      <ItemContent className="flex w-full flex-col items-start gap-1 pr-6">
                        <ItemTitle className="capitalize">{rule.threat_level} Threat</ItemTitle>
                        <ItemDescription className="line-clamp-1 text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger className="line-clamp-1 p-0 text-left w-full border-none bg-transparent">
                              {rule.description}
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="start"
                              className="max-w-62.5 whitespace-normal wrap-break-word"
                            >
                              <p>{rule.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </ItemDescription>
                      </ItemContent>
                    </Item>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction className="aria-expanded:bg-muted">
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "end" : "start"}
                      >
                        <DropdownMenuItem onClick={() => handleEditClick(rule)}>
                          <HugeiconsIcon icon={Edit} strokeWidth={2} className="text-muted-foreground" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                     
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(rule.id)}>
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="text-destructive" />
                          <span className="text-destructive">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </ScrollBlur>
            </ul>
          </div>

          <AddRuleDialog streamId={streamId} />
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={TextSquareIcon} size={20} />
                Edit Logic Rule
              </DialogTitle>
              <DialogDescription>Update the evaluation rule for this camera stream.</DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="edit-rule-description">Description</FieldLabel>
                <Input
                  id="edit-rule-description"
                  placeholder="Alert if a person walks behind the counter"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-threat-level">Threat Level</FieldLabel>
                <Select value={editThreatLevel} onValueChange={setEditThreatLevel}>
                  <SelectTrigger id="edit-threat-level">
                    <SelectValue placeholder="Select threat level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {apiErrorMsg && (
                <Alert variant="destructive" className="mb-2">
                  <HugeiconsIcon icon={Alert01Icon} size={16} />
                  <AlertTitle>Failed to update rule</AlertTitle>
                  <AlertDescription>{apiErrorMsg}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRule.isPending}>
                {updateRule.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
