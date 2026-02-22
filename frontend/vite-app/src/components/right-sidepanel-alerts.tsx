import { useQueryState } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollBlur } from "./scroll-blur";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TimelineItem, type TimelineEntry } from "./timeline-item";
import { SidebarGroup, SidebarGroupContent } from "./ui/sidebar";
import type { AnalysisEvent } from "@/lib/services";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

  // Helper to map API event to TimelineEntry
  const mapEventToEntry = (e: any): TimelineEntry => {
    let imageSrc = null;

    if (e.frame) {
      if (Array.isArray(e.frame)) {
        // Convert byte array to base64 string
        const bytes = new Uint8Array(e.frame);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageSrc = `data:image/jpeg;base64,${btoa(binary)}`;
      } else if (typeof e.frame === 'string') {
        imageSrc = e.frame.startsWith('data:') ? e.frame : `data:image/jpeg;base64,${e.frame}`;
      }
    }

    return {
      id: e.id,
      date: format(new Date(e.captured_at), "MMM d, yyyy h:mm a"),
      title: e.title || "Unknown Event",
      description: e.description,
      image: imageSrc,
      imageAlt: e.title || "Event Frame",
      risk_level: e.risk_level,
    };
  };

export function RightSidePanelAlerts({events, activeEvents, resolvedEvents}: {events:AnalysisEvent[] | undefined, activeEvents:AnalysisEvent[], resolvedEvents:AnalysisEvent[]}) {
    const [alertFilter] = useQueryState("alertFilter", { defaultValue: "all" });

    const filterByRisk = (e: AnalysisEvent) => {
      const risk = e.risk_level?.toLowerCase() || 'none';
      if (risk === 'none') return false;
      if (alertFilter !== 'all' && risk !== alertFilter) return false;
      return true;
    };

    const validEvents = events?.filter(filterByRisk) || [];
    const validActive = activeEvents.filter(filterByRisk);
    const validResolved = resolvedEvents.filter(filterByRisk);

    const indicatorClasses = alertFilter === 'high' ? 'bg-destructive shadow-[0_0_8px_var(--destructive)]'
                           : alertFilter === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                           : alertFilter === 'low' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                           : 'bg-primary shadow-[0_0_8px_var(--primary)]';

    return (
        <Card size="sm">
          <CardHeader className="p-5 pb-6">
            <CardTitle className="flex items-center gap-3">
              <div className={cn("size-2.5 ", indicatorClasses)} />
              All Alerts
              <Badge variant="outline" className="ml-auto">{validEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SidebarGroup className="px-0 pt-0">
              <Tabs defaultValue="active" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="active">Active ({validActive.length})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({validResolved.length})</TabsTrigger>
                  </TabsList>

                <SidebarGroupContent>
                  <TabsContent value="active" className="mt-0">
                    <ScrollBlur className="max-h-[calc(100vh-200px)]">
                      <div className="relative w-full mt-4 pb-44">
                        <div className="flex flex-col">
                          {validActive.length === 0 && (
                            <div className="pb-4 text-center text-xs text-muted-foreground">
                              No active events found.
                            </div>
                          )}
                          {validActive.map((event, index) => (
                            <TimelineItem
                              key={event.id}
                              entry={mapEventToEntry(event)}
                              index={index}
                              isLast={index === validActive.length - 1}
                            />
                          ))}
                        </div>
                      </div>
                    </ScrollBlur>
                  </TabsContent>

                  <TabsContent value="resolved" className="mt-0">
                    <ScrollBlur className="max-h-[calc(100vh-270px)]">
                      <div className="relative w-full mt-4 pb-44">
                        <div className="flex flex-col">
                          {validResolved.length === 0 && (
                            <div className="pb-4 text-center text-xs text-muted-foreground">
                              No resolved events found.
                            </div>
                          )}
                          {validResolved.map((event, index) => (
                            <TimelineItem
                              key={event.id}
                              entry={mapEventToEntry(event)}
                              index={index}
                              isLast={index === validResolved.length - 1}
                              hideResolve // Do not show resolve button on already resolved events
                            />
                          ))}
                        </div>
                      </div>
                    </ScrollBlur>
                  </TabsContent>
                </SidebarGroupContent>
              </Tabs>
            </SidebarGroup>
          </CardContent>
        </Card>
    )
}