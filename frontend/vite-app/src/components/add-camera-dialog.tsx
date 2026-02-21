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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { SidebarMenuButton } from "./ui/sidebar";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { streamsMutations, streamsQueries } from "@/lib/queries";

export function AddCameraDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState("usb");
  const [sourceUrl, setSourceUrl] = useState("");
  const [interval, setIntervalVal] = useState("3");

  const queryClient = useQueryClient();
  const { data: streams } = useQuery(streamsQueries.list());
  const createStream = useMutation(streamsMutations.create(queryClient));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sourceUrl) {
      alert("Name and URL are required");
      return;
    }

    if (streams?.some((stream) => stream.source_url === sourceUrl)) {
      alert("A camera with this URL or Device ID already exists.");
      return;
    }

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
        },
        onError: (error) => {
          console.error("Failed to add stream:", error);
          alert("Failed to add stream: " + error.message);
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
              Add New Stream
            </DialogTitle>
            <DialogDescription>
              Configure the connection details for your camera stream.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {/* Camera Name */}
            <Field>
              <Label htmlFor="stream-name">Name</Label>
              <Input
                id="stream-name"
                placeholder="e.g. Front Door"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            {/* Stream Source */}
            <Field>
              <Label htmlFor="source">Source</Label>
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
            <Field>
              <Label htmlFor="device-id">URL or Device ID</Label>
              <Input
                id="device-id"
                placeholder="Enter connection string"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                required
              />
            </Field>

            {/* Interval Setting */}
            <Field>
              <Label htmlFor="interval">Refresh Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min={3}
                max={5}
                value={interval}
                onChange={(e) => setIntervalVal(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Recommended range: 3 - 5 seconds.
              </p>
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
