import { rulesQueries } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SegmentedBar } from "./segmented-bar";

export function StreamActivityCard({ streamId }: { streamId: string }) {
  const { data: rules } = useQuery({
    ...rulesQueries.list(streamId),
    enabled: !!streamId,
  });

  const highCount = rules?.filter((r: any) => r.threat_level?.toLowerCase() === 'high').length || 0;
  const mediumCount = rules?.filter((r: any) => r.threat_level?.toLowerCase() === 'medium').length || 0;
  const lowCount = rules?.filter((r: any) => r.threat_level?.toLowerCase() === 'low').length || 0;

  const total = rules?.length || 0;
  const highPercentage = total ? Math.round((highCount / total) * 100) : 0;
  const mediumPercentage = total ? Math.round((mediumCount / total) * 100) : 0;
  const lowPercentage = total ? Math.round((lowCount / total) * 100) : 0;

  return (
    <Card size="sm">
      {/* Header */}
      <CardHeader className="p-5 pb-6">
        <CardTitle className="flex items-center gap-3 ">
          <div className="size-2.5 bg-blue-500" />
          Stream Activity
        </CardTitle>
      </CardHeader>

      {/* Content Area */}
      <CardContent className="p-5 pt-0">
        {/* Top Stats Row */}
        <div className="mb-8 grid grid-cols-3 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-xl text-white">{highCount}</span>
            <span className="text-[10px] text-gray-500">High</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl text-white">{mediumCount}</span>
            <span className="text-[10px] text-gray-500">Medium</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl text-white">{lowCount}</span>
            <span className="text-[10px] text-gray-500">Low</span>
          </div>
        </div>

        {/* Engagement Bars */}
        <div className="flex flex-col gap-5">
          <SegmentedBar label="High Priority Rules" percentage={highPercentage} />
          <SegmentedBar label="Medium Priority Rules" percentage={mediumPercentage} />
          <SegmentedBar label="Low Priority Rules" percentage={lowPercentage} />
        </div>
      </CardContent>
    </Card>
  );
}