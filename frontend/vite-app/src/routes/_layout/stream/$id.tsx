import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { streamsQueries } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ActivityIcon, VideoIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const Route = createFileRoute("/_layout/stream/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  
  // Fetch stream details
  const { data: stream, isLoading, isError } = useQuery(streamsQueries.detail(id));

  return (
    <div className="flex flex-col h-full bg-muted/40 overflow-hidden">
      <main className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center relative">
        {isLoading && <div className="text-muted-foreground animate-pulse">Loading stream details...</div>}
        
        {isError && (
          <div className="text-destructive font-semibold">
            Failed to load stream details.
          </div>
        )}

        {!isLoading && !isError && stream && (
          <div className="flex flex-col items-center">
            {/* Blueprint Node / Card View */}
            <Card className="w-[480px] sm:w-[560px] md:w-[940px] max-w-full shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <CardHeader className="flex flex-row items-center gap-3 bg-muted/20 border-b p-4 space-y-0">
               
                <div className="flex-1">
                  <CardTitle className="text-lg leading-none mb-1">{stream.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    {stream.source_url}
                  </CardDescription>
                </div>
                {/* Status Indicator */}
                <Badge variant="outline" className="flex items-center gap-2 font-medium bg-background px-3 py-1 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full  opacity-60", stream.enabled ? "bg-primary" : "bg-destructive")}></span>
                    <span className={cn("relative inline-flex  h-2 w-2", stream.enabled ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-destructive shadow-[0_0_8px_var(--color-destructive)]")}></span>
                  </span>
                  {stream.enabled ? "Active" : "Offline"}
                </Badge>
              </CardHeader>

              <CardContent className="p-0 relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {stream.enabled ? (
                   <img 
                      src={`http://localhost:8080/api/streams/${stream.id}/live`}
                      alt={`Live feed of ${stream.name}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${stream.id}?text=Offline`;
                      }}
                   />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <HugeiconsIcon icon={ActivityIcon} className="h-8 w-8 opacity-50" />
                    <span>Stream is currently disabled</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="grid grid-cols-2 gap-4 p-4 text-sm bg-card border-t">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Source Type</span>
                  <span className="font-medium">{stream.source_type}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Interval</span>
                  <span className="font-medium">{stream.capture_interval_sec}s per frame</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
