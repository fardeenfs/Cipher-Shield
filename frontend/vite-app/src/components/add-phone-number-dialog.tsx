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
import { Field, FieldGroup, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Alert01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { SidebarMenuButton } from "./ui/sidebar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { streamsMutations } from "@/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useParams } from "@tanstack/react-router";

export function AddPhoneNumberDialog() {
  const { id: streamId } = useParams({ from: "/stream/$id" });
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  const queryClient = useQueryClient();
  const updateStream = useMutation(streamsMutations.update(queryClient));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMsg("");

    if (!phoneNumber) {
      setErrorMsg("Phone number is required");
      return;
    }

    setErrorMsg("");
    updateStream.mutate(
      {
        id: streamId,
        payload: {
          phone_number: phoneNumber,
        }
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPhoneNumber("");
          setApiErrorMsg("");
        },
        onError: (error) => {
          console.error("Failed to add phone number:", error);
          setApiErrorMsg(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          <span> Add Phone Number</span>
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={SmartPhone01Icon} size={20} />
              Notification Settings
            </DialogTitle>
            <DialogDescription>
              Add a phone number to receive SMS alerts for this stream.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {apiErrorMsg && (
              <Alert variant="destructive" className="mb-2">
                <HugeiconsIcon icon={Alert01Icon} size={16} />
                <AlertTitle>Failed to save</AlertTitle>
                <AlertDescription>
                  {apiErrorMsg}
                </AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!errorMsg}>
              <FieldLabel htmlFor="phone-number">Phone Number</FieldLabel>
              <Input
                id="phone-number"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setErrorMsg("");
                }}
                required
                aria-invalid={!!errorMsg}
              />
              {errorMsg && (
                <FieldDescription className="text-destructive">
                  {errorMsg}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateStream.isPending}>
              {updateStream.isPending ? "Saving..." : "Save Number"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
