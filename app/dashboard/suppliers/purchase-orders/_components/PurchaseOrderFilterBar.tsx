"use client";

// Filter bar for Purchase Orders: status, date range, sort, refresh/clear,
// and the New Purchase Order action.

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
import {
  PO_STATUSES,
  PurchaseOrderDto,
} from "@/lib/inventory/purchase-order-types";

type POStatus = PurchaseOrderDto["po_status"];

const formatStatusLabel = (status: string) =>
  status === "ALL"
    ? "All Status"
    : status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

interface PurchaseOrderFilterBarProps {
  statusFilter: POStatus | "ALL";
  onStatusFilterChange: (status: POStatus | "ALL") => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  onRefresh: () => void;
  loading: boolean;
  canCreate: boolean;
  onOpenCreateModal: () => void;
}

export function PurchaseOrderFilterBar({
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
  canCreate,
  onOpenCreateModal,
}: PurchaseOrderFilterBarProps) {
  const hasClientFilter = Boolean(startDate || endDate || sort !== "DEFAULT");

  return (
    <FilterBarShell
      columns={4}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-2.5 text-xs rounded-[4px]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {hasClientFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onStartDateChange("");
                onEndDateChange("");
                onSortChange("DEFAULT");
              }}
              className="h-9 px-2.5 text-xs rounded-[4px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={onOpenCreateModal}
              className="h-9 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs px-2.5 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> New PO
            </Button>
          )}
        </div>
      }
    >
      <FilterField label="Status" className="lg:col-span-1">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange((value ?? "ALL") as POStatus | "ALL")
          }
        >
          <SelectTrigger className="!h-9 w-full px-2 text-sm rounded-[4px]">
            <SelectValue placeholder="All Status">
              {(value: string) => formatStatusLabel(value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="ALL">All Status</SelectItem>
            {PO_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        inputClassName="h-9 px-2"
        className="lg:col-span-2"
      />

      <SortSelect
        value={sort}
        onChange={onSortChange}
        showDefaultOption
        options={[
          "DATE_DESC",
          "DATE_ASC",
          "TOTAL_COST_ASC",
          "TOTAL_COST_DESC",
          "NAME_ASC",
          "NAME_DESC",
          "ID_DESC",
          "ID_ASC",
        ]}
        labelOverrides={{
          DATE_ASC: {
            menuLabel: "Oldest to Newest",
          },
          DATE_DESC: {
            menuLabel: "Newest to Oldest",
          },
          TOTAL_COST_DESC: {
            shortLabel: "Total High-Low",
            menuLabel: "Grand Total High to Low",
          },
          TOTAL_COST_ASC: {
            shortLabel: "Total Low-High",
            menuLabel: "Grand Total Low to High",
          },
          NAME_ASC: {
            shortLabel: "Supplier A-Z",
            menuLabel: "Alphabetical A-Z",
          },
          NAME_DESC: {
            shortLabel: "Supplier Z-A",
            menuLabel: "Alphabetical Z-A",
          },
        }}
        triggerClassName="w-full !h-9 px-2 text-sm rounded-[4px]"
      />
    </FilterBarShell>
  );
}
