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
import { Field, FieldGroup, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, PlusSignIcon, Alert01Icon } from "@hugeicons/core-free-icons";
import { SidebarMenuButton } from "./ui/sidebar";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { streamsMutations, streamsQueries } from "@/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AddCameraDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState("usb");
  const [sourceUrl, setSourceUrl] = useState("");
  const [interval, setIntervalVal] = useState("3");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  const queryClient = useQueryClient();
  const { data: streams } = useQuery(streamsQueries.list());
  const createStream = useMutation(streamsMutations.create(queryClient));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMsg("");

    if (!name || !sourceUrl) {
      setErrorMsg("Name and URL are required");
      return;
    }

    if (streams?.some((stream) => stream.source_url === sourceUrl)) {
      setErrorMsg("A camera with this URL or Device ID already exists.");
      return;
    }

    setErrorMsg("");
    createStream.mutate(
      {
        name,
        source_type: sourceType,
        source_url: sourceUrl,
        capture_interval_sec: parseInt(interval, 10) || 5,
      },
      {
        onSuccess: () => {
          setOpen(false);
          // Optional: clear state on success
          setName("");
          setSourceUrl("");
          setSourceType("usb");
          setIntervalVal("3");
          setApiErrorMsg("");
        },
        onError: (error) => {
          console.error("Failed to add stream:", error);
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
          <span> Add Camera</span>
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Camera01Icon} size={20} />
              Add Camera
            </DialogTitle>
            <DialogDescription>
              Configure the connection details for your camera stream.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {apiErrorMsg && (
              <Alert variant="destructive" className="mb-2">
                <HugeiconsIcon icon={Alert01Icon} size={16} />
                <AlertTitle>Failed to add stream</AlertTitle>
                <AlertDescription>
                  {apiErrorMsg}
                </AlertDescription>
              </Alert>
            )}

            {/* Camera Name */}
            <Field>
              <FieldLabel htmlFor="stream-name">Name</FieldLabel>
              <Input
                id="stream-name"
                placeholder="e.g. Front Door"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg("");
                }}
              />
            </Field>

            {/* Stream Source */}
            <Field>
              <FieldLabel htmlFor="source">Source</FieldLabel>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB / Webcam</SelectItem>
                  <SelectItem value="rtsp">RTSP</SelectItem>
                  <SelectItem value="snapshot">HTTP Snapshot</SelectItem>
                  <SelectItem value="mjpeg">HTTP MJPEG</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Device ID / URL */}
            <Field data-invalid={!!errorMsg}>
              <FieldLabel htmlFor="device-id">URL or Device ID</FieldLabel>
              <Input
                id="device-id"
                placeholder="Enter connection string"
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value);
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

            {/* Interval Setting */}
            <Field>
              <FieldLabel htmlFor="interval">Refresh Interval (seconds)</FieldLabel>
              <Input
                id="interval"
                type="number"
                min={3}
                max={5}
                value={interval}
                onChange={(e) => setIntervalVal(e.target.value)}
              />
              <FieldDescription>
                Recommended range: 3 - 5 seconds.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createStream.isPending}>
              {createStream.isPending ? "Adding..." : "+ Add Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
