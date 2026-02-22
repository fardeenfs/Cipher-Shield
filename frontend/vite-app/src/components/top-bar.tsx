import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Target01Icon } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  const [blueprintMode, setBlueprintMode] = useQueryState("blueprintMode", { defaultValue: "on" });
  const [alertFilter, setAlertFilter] = useQueryState("alertFilter", { defaultValue: "all" });

  return (
    <header className="bg-card shrink-0 h-14 border-b flex items-center justify-between px-4 w-full z-50">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <HugeiconsIcon icon={Target01Icon} className="text-primary size-5" strokeWidth={2} />
          <span>Cipher-Shield</span>
        </div>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <button 
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          ← Projects View
        </button>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Analysis Mode
        </span>
        <Tabs value={blueprintMode} onValueChange={setBlueprintMode}>
          <TabsList variant="line" className="h-9 bg-transparent">
            <TabsTrigger value="on">Blueprint</TabsTrigger>
            <TabsTrigger value="off">Global</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-2">
            Alert Filter
          </span>
          <Tabs value={alertFilter} onValueChange={setAlertFilter}>
            <TabsList variant="line" className="h-9 bg-transparent">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">
                <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-destructive"></div>High</span>
              </TabsTrigger>
              <TabsTrigger value="medium">
                <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-orange-500"></div>Medium</span>
              </TabsTrigger>
              <TabsTrigger value="low">
                <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-green-500"></div>Low</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}
