import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { TextSquareIcon, Alert01Icon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rulesMutations } from "@/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AddRuleDialogProps {
  streamId: string;
}

export function AddRuleDialog({ streamId }: AddRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [threatLevel, setThreatLevel] = useState("medium");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  const queryClient = useQueryClient();
  const handleOnclose = () => {
    setOpen(false);
    setDescription("");
    setThreatLevel("medium");
    setApiErrorMsg("");
  };
  const createRule = useMutation(rulesMutations.create(queryClient, streamId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMsg("");

    if (!description) {
      return;
    }

    createRule.mutate(
      {
        description,
        threat_level: threatLevel as "none" | "low" | "medium" | "high",
      },
      {
        onSuccess: () => {
          setOpen(false);
          setDescription("");
          setThreatLevel("medium");
          setApiErrorMsg("");
        },
        onError: (error) => {
          console.error("Failed to add rule:", error);
          setApiErrorMsg(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-white/10 bg-transparent text-xs hover:bg-white/10 hover:text-white"
        >
          <span className="mr-2 text-lg leading-none">+</span> Add Logic
          Rule
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={TextSquareIcon} size={20} />
              Add Logic Rule
            </DialogTitle>
            <DialogDescription>
              Create a new evaluation rule for this camera stream.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
  
            <Field>
              <FieldLabel htmlFor="rule-description">Description</FieldLabel>
              <Input
                id="rule-description"
                placeholder="Alert if a person walks behind the counter"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="threat-level">Threat Level</FieldLabel>
              <Select value={threatLevel} onValueChange={setThreatLevel}>
                <SelectTrigger id="threat-level">
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
                <AlertTitle>Failed to add rule</AlertTitle>
                <AlertDescription>
                  {apiErrorMsg}
                </AlertDescription>
              </Alert>
            )}

          </FieldGroup>

          <DialogFooter>
            
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleOnclose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? "Adding..." : "+ Add Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
