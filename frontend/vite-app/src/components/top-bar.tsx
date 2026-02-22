import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function TopBar() {
  const [blueprintMode, setBlueprintMode] = useQueryState("blueprintMode", { defaultValue: "on" });
  const [alertFilter, setAlertFilter] = useQueryState("alertFilter", { defaultValue: "all" });

  return (
    <header className="bg-card backdrop-blur-md shrink-0 h-14 border-b flex items-center justify-between px-4 w-full">
      {/* Left section */}
      

      {/* Center Section */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
           View mode
        </span>
        <Tabs value={blueprintMode} onValueChange={setBlueprintMode}>
          <TabsList variant="default" className="h-9 bg-transparent">
            <TabsTrigger value="on">Blueprint</TabsTrigger>
            <TabsTrigger value="off">Blind spot</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-2">
            Filter
          </span>
          <Tabs value={alertFilter} onValueChange={setAlertFilter}>
            <TabsList variant="line" className="h-9 bg-transparent">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">
                <span className="flex items-center gap-1.5"><div className="size-2  bg-destructive"></div>High</span>
              </TabsTrigger>
              <TabsTrigger value="medium">
                <span className="flex items-center gap-1.5"><div className="size-2  bg-orange-500"></div>Medium</span>
              </TabsTrigger>
              <TabsTrigger value="low">
                <span className="flex items-center gap-1.5"><div className="size-2  bg-green-500"></div>Low</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}
