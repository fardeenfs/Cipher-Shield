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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { settingsMutations, settingsQueries } from "@/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect } from "react";

export function GlobalPhoneNumberDialog() {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  const queryClient = useQueryClient();
  const updateAlertPhone = useMutation(settingsMutations.updateAlertPhone(queryClient));

  const { data: alertSettings } = useQuery(settingsQueries.alertPhone());

  useEffect(() => {
    if (alertSettings?.alert_phone_number && !open) {
      setPhoneNumber(alertSettings.alert_phone_number);
    }
  }, [alertSettings, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMsg("");

    if (!phoneNumber) {
      setErrorMsg("Phone number is required");
      return;
    }

    setErrorMsg("");
    updateAlertPhone.mutate(
      {
        alert_phone_number: phoneNumber || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
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
          <span> Global Alert Number</span>
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
              Set the global phone number to receive SMS alerts for high-risk events across all cameras.
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
            <Button type="submit" disabled={updateAlertPhone.isPending}>
              {updateAlertPhone.isPending ? "Saving..." : "Save Number"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
