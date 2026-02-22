import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { parseAsIsoDateTime, useQueryState } from "nuqs";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, CalendarIcon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function DatePicker() {
  const [fromDateQuery, setFromDateQuery] = useQueryState("from", parseAsIsoDateTime);
  const [toDateQuery, setToDateQuery] = useQueryState("to", parseAsIsoDateTime);

  // Local state for the calendar range and time inputs before "Done" is clicked
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: fromDateQuery || addDays(new Date(), -7),
    to: toDateQuery || new Date(),
  });
  const [startTime, setStartTime] = React.useState("00:00:00");
  const [endTime, setEndTime] = React.useState("23:59:59");

  const [open, setOpen] = React.useState(false);

  // Sync back to nuqs when closing popover via "Done"
  const handleDone = () => {
    if (range?.from) {
      // Combine date and time
      const [fromHours, fromMinutes, fromSeconds] = startTime.split(':').map(Number);
      const fromWithTime = new Date(range.from);
      fromWithTime.setHours(fromHours || 0, fromMinutes || 0, fromSeconds || 0);
      setFromDateQuery(fromWithTime);
    } else {
      setFromDateQuery(null);
    }

    if (range?.to) {
      const [toHours, toMinutes, toSeconds] = endTime.split(':').map(Number);
      const toWithTime = new Date(range.to);
      toWithTime.setHours(toHours || 23, toMinutes || 59, toSeconds || 59);
      setToDateQuery(toWithTime);
    } else {
      setToDateQuery(null);
    }
    setOpen(false);
  };

  return (
    <Card size="sm" className="mb-4">
      <CardHeader className="p-5 pb-6">
        <CardTitle className="flex items-center gap-3">
          <div className="size-2.5 bg-secondary shadow-[0_0_5px_var(--secondary)]" />
          Select Date
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-with-dropdowns-desktop"
              className="w-full justify-start text-left font-normal px-2.5"
            >
              <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
              {range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, "LLL dd, y")} -{" "}
                    {format(range.to, "LLL dd, y")}
                  </>
                ) : (
                  format(range.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Calendar
              mode="range"
              buttonVariant="secondary"
              selected={range}
              onSelect={setRange}
              captionLayout="dropdown"
              className="bg-transparent [--cell-size:1.5rem]"
            />
            <div className="px-2 pb-2">
              <FieldGroup className="mb-2">
                <Field>
                  <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="time-from"
                      type="time"
                      step="1"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none min-w-0"
                    />
                    <InputGroupAddon>
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        strokeWidth={2}
                        className="text-muted-foreground w-4 h-4"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="time-to">End Time</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="time-to"
                      type="time"
                      step="1"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none min-w-0"
                    />
                    <InputGroupAddon>
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        strokeWidth={2}
                        className="text-muted-foreground w-4 h-4"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </FieldGroup>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setFromDateQuery(null);
                    setToDateQuery(null);
                    setRange({ from: undefined, to: undefined });
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={handleDone}
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
