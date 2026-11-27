"use client";

// Filter bar for Forwarders: search, status, sort, and the Add Forwarder action.

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
  all: "All Status",
  active: "Active",
  inactive: "Inactive",
};

interface ForwarderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  onOpenCreateModal: () => void;
}

export function ForwarderFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  onOpenCreateModal,
}: ForwarderFilterBarProps) {
  return (
    <FilterBarShell
      columns={5}
      search={{
        value: searchQuery,
        onChange: onSearchChange,
        placeholder: "Search company or contact...",
      }}
      action={
        <Button
          onClick={onOpenCreateModal}
          className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Forwarder
        </Button>
      }
    >
      <FilterField label="Status">
        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val ?? "all")}
        >
          <SelectTrigger className="w-full !h-9">
            <SelectValue placeholder="Filter by Status">
              {STATUS_LABELS[statusFilter] ?? "All Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <SortSelect
        value={sort}
        onChange={onSortChange}
        showDefaultOption
        options={["NAME_ASC", "NAME_DESC"]}
        triggerClassName="w-full sm:w-[175px] !h-9 text-sm"
      />
    </FilterBarShell>
  );
}
