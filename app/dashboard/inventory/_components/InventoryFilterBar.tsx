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
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { FilterBarShell, FilterField } from "@/components/shared/FilterBarShell";

export type StatusTab = "all" | "low" | "adequate";
export type SortOption = SortKey;

interface CategoryOption {
  id: number;
  name: string;
}

interface InventoryFilterBarProps {
  search: string;
  setSearch: (search: string) => void;
  category: string | null;
  setCategory: (category: string | null) => void;
  categories: CategoryOption[];
  status: StatusTab;
  setStatus: (status: StatusTab) => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
}

export function InventoryFilterBar({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  status,
  setStatus,
  sort,
  setSort,
}: InventoryFilterBarProps) {
  return (
    <FilterBarShell
      columns={5}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search by name, description, or SKU...",
      }}
    >
      <FilterField label="Category">
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
      </FilterField>

      <FilterField label="Stock Status">
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
      </FilterField>

      <SortSelect
        value={sort}
        onChange={setSort}
        showDefaultOption
        options={["NAME_ASC", "NAME_DESC", "STOCK_ASC", "STOCK_DESC"]}
        triggerClassName="w-full !h-9 text-sm rounded-[2px]"
      />
    </FilterBarShell>
  );
}