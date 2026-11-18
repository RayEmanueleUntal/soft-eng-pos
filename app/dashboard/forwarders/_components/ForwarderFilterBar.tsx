"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SortSelect, SortKey } from "@/components/ui/sort-select";

interface ForwarderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sort?: SortKey;
  onSortChange?: (sort: SortKey) => void;
  onOpenCreateModal: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  all: "All Status",
  active: "Active",
  inactive: "Inactive",
};

export function ForwarderFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sort: externalSort,
  onSortChange: externalOnSortChange,
  onOpenCreateModal,
}: ForwarderFilterBarProps) {
  const [internalSort, setInternalSort] = React.useState<SortKey>("DEFAULT");
  const sort = externalSort ?? internalSort;
  const onSortChange = externalOnSortChange ?? setInternalSort;

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label>Search</Label>
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search company name or contact info..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Status Filter + Sort Select */}
        <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(val) => onStatusFilterChange(val ?? "all")}
            >
              <SelectTrigger className="w-[150px] !h-9">
                <SelectValue placeholder="Filter by Status">
                  {STATUS_LABELS[statusFilter] ?? "All Status"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SortSelect
            value={sort}
            onChange={onSortChange}
            showDefaultOption
            options={[
              "NAME_ASC",
              "NAME_DESC",
            ]}
            triggerClassName="w-[175px] !h-9 text-sm"
          />
        </div>

        <div className="lg:col-start-5 flex lg:justify-end">
          {/* Add Forwarder Button */}
          <Button
            onClick={onOpenCreateModal}
            className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Forwarder
          </Button>
        </div>
      </div>
    </div>
  );
}