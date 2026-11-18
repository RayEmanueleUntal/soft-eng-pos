"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
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
  onOpenAddModal: () => void;
}

export function CustomerFilterBar({
  filters,
  onFiltersChange,
  onOpenAddModal,
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

  const TYPE_LABELS: Record<string, string> = {
    all: "All Customers",
    RETAIL: "Retail",
    WHOLESALE: "Wholesale",
  };

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, contact, or company..."
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
            />            
          </div>
        </div>


        <div className="flex flex-col gap-2">
          <Label>Filter by Customer Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => {
              if (!value || value === "all") {
                updateFilter("type", "");
              } else if (value === "RETAIL" || value === "WHOLESALE") {
                updateFilter("type", value);
              }
            }}
          >
            <SelectTrigger className="w-[170px] h-9 text-[13px] rounded-[2px]">
              <SelectValue placeholder="All Customers">
                {TYPE_LABELS[filters.type || "all"] ?? "All Customers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="RETAIL">Retail</SelectItem>
              <SelectItem value="WHOLESALE">Wholesale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-start-5 flex lg:justify-end">
          <Button
            onClick={onOpenAddModal}
            className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Customer
          </Button>        
        </div>
      </div>
    </div>

  );
}
