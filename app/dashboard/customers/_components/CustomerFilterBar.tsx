"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_CUSTOMER_FILTERS,
  type CustomerFilters,
} from "@/lib/customers/types";

interface CustomerFilterBarProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
}

export function CustomerFilterBar({
  filters,
  onFiltersChange,
}: CustomerFilterBarProps) {
  const updateFilter = <K extends keyof CustomerFilters>(
    key: K,
    value: CustomerFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.name ||
      filters.contact_number ||
      filters.type ||
      filters.company_name,
  );

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-[4px] border border-border shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search name, contact, or company..."
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          className="w-[220px] pl-8 h-8 text-[13px] rounded-[2px]"
        />
      </div>

      <Input
        placeholder="Filter by name..."
        value={filters.name}
        onChange={(event) => updateFilter("name", event.target.value)}
        className="w-[160px] h-8 text-[13px] rounded-[2px]"
      />

      <Input
        placeholder="Filter by contact #..."
        value={filters.contact_number}
        onChange={(event) =>
          updateFilter("contact_number", event.target.value)
        }
        className="w-[160px] h-8 text-[13px] rounded-[2px]"
      />

      <Input
        placeholder="Filter by company..."
        value={filters.company_name}
        onChange={(event) => updateFilter("company_name", event.target.value)}
        className="w-[190px] h-8 text-[13px] rounded-[2px]"
      />

      <Select
        value={filters.type || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            updateFilter("type", "");
          } else if (value === "RETAIL" || value === "WHOLESALE") {
            updateFilter("type", value);
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-8 text-[13px] rounded-[2px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="RETAIL">Retail</SelectItem>
          <SelectItem value="WHOLESALE">Wholesale</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        onClick={() => onFiltersChange({ ...EMPTY_CUSTOMER_FILTERS })}
        disabled={!hasActiveFilters}
        className="h-8 px-3 text-[13px] rounded-[2px]"
      >
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
