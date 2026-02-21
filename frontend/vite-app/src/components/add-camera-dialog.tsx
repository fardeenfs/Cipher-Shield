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

export function AddCameraDialog() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your logic here
    console.log("Form submitted");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="mr-2" />
          Add Camera
        </Button>
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
              <Input id="stream-name" placeholder="e.g. Front Door" required />
            </Field>

            {/* Stream Source */}
            <Field>
              <Label htmlFor="source">Source</Label>
              <Select defaultValue="usb">
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB / Webcam</SelectItem>
                  <SelectItem value="rtsp">RTSP</SelectItem>
                  <SelectItem value="ip">HTTP Snapshot</SelectItem>
                  <SelectItem value="ip">HTTP MJPEG</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Device ID / URL */}
            <Field>
              <Label htmlFor="device-id">URL or Device ID</Label>
              <Input id="device-id" placeholder="Enter connection string" />
            </Field>

            {/* Interval Setting */}
            <Field>
              <Label htmlFor="interval">Refresh Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min={3}
                max={5}
                defaultValue={3}
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
            <Button type="submit">+ Add Stream</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
