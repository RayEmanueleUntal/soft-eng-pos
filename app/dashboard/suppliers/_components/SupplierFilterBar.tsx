"use client";

// Filter bar for the Suppliers list: search, status, sort, and the Add Supplier action.

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { FilterBarShell, FilterField } from "@/components/shared/FilterBarShell";

const STATUS_LABELS: Record<string, string> = {
  ALL: "All Status",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

interface SupplierFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  onAdd: () => void;
}

export function SupplierFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onAdd,
}: SupplierFilterBarProps) {
  return (
    <FilterBarShell
      columns={4}
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: "Search supplier by name or contact...",
      }}
      action={
        <Button
          onClick={onAdd}
          className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Supplier
        </Button>
      }
    >
      <FilterField label="Supplier Status">
        <Select
          value={status}
          onValueChange={(val) => onStatusChange(val ?? "ALL")}
        >
          <SelectTrigger className="w-full !h-9">
            <SelectValue placeholder="Filter by Status">
              {STATUS_LABELS[status] ?? "All Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <SortSelect
        value={sort}
        onChange={onSortChange}
        showDefaultOption
        options={["NAME_ASC", "NAME_DESC", "STOCK_ASC", "STOCK_DESC"]}
        labelOverrides={{
          DEFAULT: { menuLabel: "Default Sort" },
          STOCK_ASC: {
            shortLabel: "Lead Time Low-High",
            menuLabel: "Lead Time Low to High",
          },
          STOCK_DESC: {
            shortLabel: "Lead Time High-Low",
            menuLabel: "Lead Time High to Low",
          },
        }}
        triggerClassName="w-full !h-9 px-2 text-sm"
      />
    </FilterBarShell>
  );
}
