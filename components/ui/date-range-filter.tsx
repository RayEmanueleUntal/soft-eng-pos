// components/ui/date-range-filter.tsx
"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  /** Optional label above the inputs (defaults to "Date Range", pass null to hide) */
  label?: string | null;
  /** Adjust trigger button height/width to match sibling filters (e.g. "h-9 w-[135px]") */
  inputClassName?: string;
  disabled?: boolean;
  className?: string;
}

/** Parse YYYY-MM-DD in local time to avoid UTC off-by-one shifts */
function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return undefined;
  const parsed = parse(match[1], "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
  inputClassName,
  disabled = false,
  className,
}: DateRangeFilterProps) {
  const [startOpen, setStartOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);

  const startObj = parseLocalDate(startDate);
  const endObj = parseLocalDate(endDate);

  const triggerBaseClasses = cn(
    buttonVariants({ variant: "outline" }),
    "h-8 w-[130px] justify-start px-2.5 text-left text-xs font-normal rounded-[2px]",
    "bg-white hover:bg-white dark:bg-background dark:hover:bg-background",
    "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50",
    inputClassName,
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label !== null && <Label>{label}</Label>}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">From:</span>
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            className={cn(
              triggerBaseClasses,
              startObj ? "font-mono" : "font-sans text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
            <span className="truncate">
              {startObj ? format(startObj, "yyyy-MM-dd") : "Select date"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startObj}
              defaultMonth={startObj ?? endObj}
              disabled={endObj ? { after: endObj } : undefined}
              onSelect={(date) => {
                onStartDateChange(date ? format(date, "yyyy-MM-dd") : "");
                setStartOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground">To:</span>
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            className={cn(
              triggerBaseClasses,
              endObj ? "font-mono" : "font-sans text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
            <span className="truncate">
              {endObj ? format(endObj, "yyyy-MM-dd") : "Select date"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endObj}
              defaultMonth={endObj ?? startObj}
              disabled={startObj ? { before: startObj } : undefined}
              onSelect={(date) => {
                onEndDateChange(date ? format(date, "yyyy-MM-dd") : "");
                setEndOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}