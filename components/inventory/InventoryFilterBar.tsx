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
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search inventory..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-[220px]"
      />

      <Input
        placeholder="Filter by size..."
        value={size ?? ""}
        onChange={(event) => setSize(event.target.value || null)}
        className="w-[180px]"
      />

      <Input
        placeholder="Filter by thread type..."
        value={threadType ?? ""}
        onChange={(event) => setThreadType(event.target.value || null)}
        className="w-[200px]"
      />

      <Input
        placeholder="Filter by material..."
        value={material ?? ""}
        onChange={(event) => setMaterial(event.target.value || null)}
        className="w-[200px]"
      />

      <Select
        value={category || ""}
        onValueChange={(value) => setCategory(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
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
      >
        Clear Filters
      </Button>
    </div>
  );
}
