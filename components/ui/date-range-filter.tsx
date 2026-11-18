// components/ui/date-range-filter.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  /** Optional label above the inputs (defaults to "Date Range", pass null to hide) */
  label?: string | null;
  /** Adjust input height/width to match sibling filters (e.g. "h-9 w-[135px]") */
  inputClassName?: string;
  disabled?: boolean;
  className?: string;
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
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label !== null && <Label>{label}</Label>}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">From:</span>
        <Input
          type="date"
          value={startDate}
          max={endDate || undefined}
          disabled={disabled}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={cn(
            "h-8 w-[125px] font-mono text-xs rounded-[2px]",
            inputClassName,
          )}
        />
        <span className="text-xs text-muted-foreground">To:</span>
        <Input
          type="date"
          value={endDate}
          min={startDate || undefined}
          disabled={disabled}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={cn(
            "h-8 w-[125px] font-mono text-xs rounded-[2px]",
            inputClassName,
          )}
        />
      </div>
    </div>
  );
}