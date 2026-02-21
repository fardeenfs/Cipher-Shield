export function SegmentedBar({
  label,
  percentage,
}: {
  label: string;
  percentage: number;
}) {
  const totalSegments = 10;
  const activeSegments = Math.round((percentage / 100) * totalSegments);

  return (
    <div className="flex flex-col gap-2">
      {/* Label & Percentage */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {/* Using your theme's primary color for the indicator dot */}
          <div className="size-1.5 bg-primary" />
          <span>{label}</span>
        </div>
        <span>{percentage}</span>
      </div>

      {/* chonky Bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-full rounded-[1px] ${
              // Primary for active chunks, secondary for the dim background chunks
              i < activeSegments ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
