// Filter bar for the Inventory Management module of the POS system.
// Provides search, size, thread, material, category, status, and sort filters with a clear button.
// Used by the inventory page, which owns the filter state.
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

export type StatusTab = "all" | "low" | "adequate";
export type SortOption = "default" | "az" | "za";

interface CategoryOption {
  id: number;
  name: string;
}

interface InventoryFilterBarProps {
  search: string;
  setSearch: (search: string) => void;

  size: string | null;
  setSize: (size: string | null) => void;

  threadType: string | null;
  setThreadType: (threadType: string | null) => void;

  material: string | null;
  setMaterial: (material: string | null) => void;

  category: string | null;
  setCategory: (category: string | null) => void;

  categories: CategoryOption[];

  status: StatusTab;
  setStatus: (status: StatusTab) => void;

  sort: SortOption;
  setSort: (sort: SortOption) => void;

}

// Renders the filter inputs and reports every change to the parent page.
export function InventoryFilterBar({
search,
  setSearch,
  size,
  setSize,
  threadType,
  setThreadType,
  material,
  setMaterial,
  category,
  setCategory,
  categories,
  status,
  setStatus,
  sort: externalSort,
  setSort: externalSetSort,
}: InventoryFilterBarProps) {
  // Resets every filter at once.
  const handleClearFilters = () => {
    setSearch("");
    setSize(null);
    setThreadType(null);
    setMaterial(null);
    setCategory(null);
    setStatus("all");
    setSort("default");
  };

  const [internalSort, setInternalSort] = React.useState<SortOption>("default");
  const sort = externalSort ?? internalSort;
  const setSort = externalSetSort ?? setInternalSort;

  const areFiltersActive =
    Boolean(search) ||
    Boolean(size) ||
    Boolean(threadType) ||
    Boolean(material) ||
    Boolean(category) ||
    status !== "all" ||
    sort !== "default";

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={category || "all"}
            onValueChange={(value) => setCategory(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full !h-9 text-sm rounded-[2px]">
              <SelectValue placeholder="Filter by category...">
                {(val: string | null) => {
                  if (!val || val === "all") return "All Categories";
                  return (
                    categories.find((item) => String(item.id) === val)?.name ??
                    "Filter by category..."
                  );
                }}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Stock Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusTab)}
          >
            <SelectTrigger className="w-full !h-9 text-sm rounded-[2px]">
              <SelectValue placeholder="Filter by Status">
                {{
                  all: "All Stock Levels",
                  low: "Low Stock",
                  adequate: "Adequate Stock",
                }[status]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stocks</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="adequate">Adequate Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Sort</Label>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortOption)}
          >
            <SelectTrigger className="w-full !h-9 text-sm rounded-[2px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Sort by">
                  {{
                    default: "Default Sort",
                    az: "Alphabetical A-Z",
                    za: "Alphabetical Z-A",
                  }[sort]}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Sort</SelectItem>
              <SelectItem value="az">Alphabetical A-Z</SelectItem>
              <SelectItem value="za">Alphabetical Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}