"use client";

// Filter bar for Shipments: search, status, date range, sort, refresh/clear,
// and the Log Shipment action.

import { Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { FilterBarShell, FilterField } from "@/components/shared/FilterBarShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShipmentFilter } from "@/lib/inventory/useShipments";
import { STATUS_LABELS } from "@/lib/inventory/shipment-utils";

const FILTER_LABELS: Record<ShipmentFilter, string> = {
  ALL: "All Status",
  PENDING: STATUS_LABELS.PENDING,
  DISPATCHED: STATUS_LABELS.DISPATCHED,
  DELIVERED: STATUS_LABELS.DELIVERED,
};

interface ShipmentFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  statusFilter: ShipmentFilter;
  onStatusFilterChange: (value: ShipmentFilter) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  onRefresh: () => void;
  loading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  canCreate: boolean;
  onOpenCreateModal: () => void;
}

export function ShipmentFilterBar({
  searchInput,
  onSearchInputChange,
  statusFilter,
  onStatusFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sort,
  onSortChange,
  onRefresh,
  loading,
  hasActiveFilters,
  onClearFilters,
  canCreate,
  onOpenCreateModal,
}: ShipmentFilterBarProps) {
  return (
    <FilterBarShell
      columns={7}
      gridClassName="lg:grid-cols-[1fr_1fr_1.05fr_1.05fr_1.05fr_1.05fr_0.9fr]"
      search={{
        value: searchInput,
        onChange: onSearchInputChange,
        placeholder: "Search inv/tracking",
      }}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh shipments"
            className="h-9 w-9 p-0 text-xs rounded-[4px] hover:bg-muted shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              title="Clear filters"
              aria-label="Clear filters"
              className="h-9 w-9 p-0 text-xs rounded-[4px] text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={onOpenCreateModal}
              className="h-9 px-3 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Log Shipment
            </Button>
          )}
        </div>
      }
    >
      <FilterField label="Status">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange((value ?? "ALL") as ShipmentFilter)
          }
        >
          <SelectTrigger className="!h-9 w-full px-1.5 text-sm rounded-[4px]">
            <SelectValue placeholder="All Status">
              {FILTER_LABELS[statusFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">{STATUS_LABELS.PENDING}</SelectItem>
            <SelectItem value="DISPATCHED">
              {STATUS_LABELS.DISPATCHED}
            </SelectItem>
            <SelectItem value="DELIVERED">
              {STATUS_LABELS.DELIVERED}
            </SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        inputClassName="h-9 px-1.5"
        className="lg:col-span-3"
      />

      <SortSelect
        value={sort}
        onChange={onSortChange}
        showDefaultOption
        options={["DATE_ASC", "DATE_DESC", "ID_ASC", "ID_DESC"]}
        labelOverrides={{
          DEFAULT: {
            shortLabel: "Default",
            menuLabel: "Default Sort",
          },
          DATE_ASC: {
            shortLabel: "Oldest",
            menuLabel: "Date Dispatched Low to High",
          },
          DATE_DESC: {
            shortLabel: "Newest",
            menuLabel: "Date Dispatched High to Low",
          },
          ID_ASC: {
            shortLabel: "ID Low",
            menuLabel: "ID# Low to High",
          },
          ID_DESC: {
            shortLabel: "ID High",
            menuLabel: "ID# High to Low",
          },
        }}
        triggerClassName="w-full !h-9 px-2 text-sm rounded-[4px]"
      />
    </FilterBarShell>
  );
}
