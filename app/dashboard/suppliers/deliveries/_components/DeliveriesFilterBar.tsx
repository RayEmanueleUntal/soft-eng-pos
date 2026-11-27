"use client";

// Filter bar for Deliveries: sort, date range, refresh/clear,
// and the Receive Delivery action (role-gated by the caller).

import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { FilterBarShell } from "@/components/shared/FilterBarShell";

interface DeliveriesFilterBarProps {
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  /** Receive Delivery trigger (renders its own button via ReceiveDeliveryModal) */
  receiveAction?: React.ReactNode;
}

export function DeliveriesFilterBar({
  sort,
  onSortChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onRefresh,
  loading,
  hasActiveFilters,
  onClearFilters,
  receiveAction,
}: DeliveriesFilterBarProps) {
  return (
    <FilterBarShell
      columns={4}
      action={
        <div className="flex items-center gap-2">
          {receiveAction}
        </div>
      }
    >
      <SortSelect
        value={sort}
        onChange={onSortChange}
        showDefaultOption
        options={["DATE_DESC", "DATE_ASC"]}
        triggerClassName="w-full sm:w-[170px] !h-9 text-sm rounded-[2px]"
      />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        inputClassName="h-9 px-2"
        className="lg:col-span-2"
      />

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-[2px] gap-1.5 text-xs h-9 hover:bg-muted shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2.5 text-xs rounded-[2px] text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </FilterBarShell>
  );
}
