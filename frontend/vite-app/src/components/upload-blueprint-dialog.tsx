import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Cancel01Icon, Upload01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blueprintsMutations } from "@/lib/queries";

export function UploadBlueprintDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createBlueprint = useMutation(blueprintsMutations.create(queryClient));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Extract the actual base64 string, removing the Data-URL prefix like "data:image/jpeg;base64,"
      const base64Data = base64.split(",")[1];
      createBlueprint.mutate(
        {
          name: file.name,
          image_base64: base64Data,
        },
        {
          onSuccess: () => {
            setOpen(false);
            clearFile();
          },
        }
      );
    };
    reader.onerror = (error) => console.log("Error reading file:", error);
    reader.readAsDataURL(file);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="shrink-0 ">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          <span> Add </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>File Upload</DialogTitle>
          <DialogDescription>
            Upload a blueprint image to use as the background for the floorplan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full">
          <form className="w-full" onSubmit={handleUpload}>
            <div className="mt-2 flex justify-center space-x-4 rounded-none border border-dashed border-input px-6 py-10">
              <div className="sm:flex sm:items-center sm:gap-x-3">
                <HugeiconsIcon 
                  icon={Upload01Icon}
                  className="mx-auto h-8 w-8 text-muted-foreground sm:mx-0 sm:h-6 sm:w-6"
                  aria-hidden={true}
                />
                <div className="mt-4 flex text-sm leading-6 text-foreground sm:mt-0">
                  <p>Drag and drop or</p>
                  <Label
                    htmlFor="file-upload-blueprint"
                    className="relative cursor-pointer rounded-none pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                  >
                    <span>choose file</span>
                    <input
                      id="file-upload-blueprint"
                      name="file-upload-blueprint"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Label>
                  <p className="text-pretty pl-1">to upload</p>
                </div>
              </div>
            </div>
            <p className="text-pretty mt-2 flex items-center justify-between text-xs leading-5 text-muted-foreground">
              Recommended max. size: 10 MB, Accepted file types: PNG, JPG, JPEG, WEBP.
            </p>
            
            {file && (
              <div className="relative mt-8 rounded-none bg-muted p-3">
                <div className="absolute right-1 top-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-sm p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Remove"
                    onClick={clearFile}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-4 shrink-0" aria-hidden={true} />
                  </Button>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-background shadow-sm ring-1 ring-inset ring-input overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <HugeiconsIcon
                        icon={Image01Icon}
                        className="size-5 text-foreground"
                        aria-hidden={true}
                      />
                    )}
                  </span>
                  <div className="w-full pr-8">
                    <p className="text-pretty text-xs font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <div className="mt-1 flex flex-col gap-1">
                      <p className="text-pretty flex justify-between text-xs text-muted-foreground">
                        <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <span>{createBlueprint.isPending ? "Uploading..." : "Ready"}</span>
                      </p>
                      {createBlueprint.isPending && (
                        <Progress value={undefined} className="w-full" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="whitespace-nowrap rounded-none border border-input px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={!file || createBlueprint.isPending}
                className="whitespace-nowrap rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {createBlueprint.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
