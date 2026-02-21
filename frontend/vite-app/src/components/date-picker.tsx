import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

export function DatePicker() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 11, 8),
    to: addDays(new Date(new Date().getFullYear(), 11, 8), 10),
  });
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupLabel className="flex justify-between items-center">
        Select date
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <Calendar
          mode="range"
          buttonVariant="secondary"
          selected={range}
          onSelect={setRange}
          captionLayout="dropdown"
          className="bg-transparent [--cell-size:2.1rem]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
