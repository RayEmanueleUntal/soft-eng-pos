// Filter bar for the Inventory Management module of the POS system.
// Provides search, size, thread, material and category filters with a clear button.
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

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
}: InventoryFilterBarProps) {
  // Resets every filter at once.
  const handleClearFilters = () => {
    setSearch("");
    setSize(null);
    setThreadType(null);
    setMaterial(null);
    setCategory(null);
  };

  const areFiltersActive =
    Boolean(search) ||
    Boolean(size) ||
    Boolean(threadType) ||
    Boolean(material) ||
    Boolean(category);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-[4px] border border-border shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search inventory..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-[200px] pl-8 h-8 text-[13px] rounded-[2px]"
        />
      </div>

      <Input
        placeholder="Filter by size..."
        value={size ?? ""}
        onChange={(event) => setSize(event.target.value || null)}
        className="w-[160px] h-8 text-[13px] rounded-[2px]"
      />

      <Input
        placeholder="Filter by thread type..."
        value={threadType ?? ""}
        onChange={(event) => setThreadType(event.target.value || null)}
        className="w-[160px] h-8 text-[13px] rounded-[2px]"
      />

      <Input
        placeholder="Filter by material..."
        value={material ?? ""}
        onChange={(event) => setMaterial(event.target.value || null)}
        className="w-[160px] h-8 text-[13px] rounded-[2px]"
      />

      <Select
        value={category || "all"}
        onValueChange={(value) => setCategory(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px] h-8 text-[13px] rounded-[2px]">
          <SelectValue placeholder="Filter by category..." />
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

      <Button
        variant="ghost"
        onClick={handleClearFilters}
        disabled={!areFiltersActive}
        className="h-8 px-3 text-[13px] rounded-[2px]"
      >
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
