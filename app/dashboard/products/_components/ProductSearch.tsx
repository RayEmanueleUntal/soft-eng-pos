"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { Search } from "lucide-react";
import { useProductCategories } from "@/lib/products/product-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;

  thread: string;
  onThreadChange: (value: string) => void;

  material: string;
  onMaterialChange: (value: string) => void;

  size: string;
  onSizeChange: (value: string) => void;

  categoryId: string;
  onCategoryChange: (value: string) => void;

  sort?: SortKey;
  onSortChange?: (value: SortKey) => void;

  startDate?: string;
  onStartDateChange?: (value: string) => void;

  endDate?: string;
  onEndDateChange?: (value: string) => void;

  actionSlot?: ReactNode;
}

export function ProductSearch({
  searchTerm,
  onSearchChange,
  categoryId,
  onCategoryChange,
  sort: externalSort,
  onSortChange: externalOnSortChange,
  startDate: externalStartDate,
  onStartDateChange: externalOnStartDateChange,
  endDate: externalEndDate,
  onEndDateChange: externalOnEndDateChange,
  actionSlot,
}: ProductSearchProps) {
  const [internalSort, setInternalSort] = React.useState<SortKey>("DEFAULT");
  const [internalStartDate, setInternalStartDate] = React.useState("");
  const [internalEndDate, setInternalEndDate] = React.useState("");

  const sort = externalSort ?? internalSort;
  const onSortChange = externalOnSortChange ?? setInternalSort;
  const startDate = externalStartDate ?? internalStartDate;
  const onStartDateChange = externalOnStartDateChange ?? setInternalStartDate;
  const endDate = externalEndDate ?? internalEndDate;
  const onEndDateChange = externalOnEndDateChange ?? setInternalEndDate;

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useProductCategories();

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-2 min-w-[240px] flex-1">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or SKU..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={categoryId || "__all__"}
            onValueChange={(val) =>
              onCategoryChange(!val || val === "__all__" ? "" : val)
            }
          >
            <SelectTrigger className="w-[270px] !h-9 text-sm">
              <SelectValue placeholder="All Categories">
                {categoriesLoading
                  ? "Loading..."
                  : (categories.find((c) => String(c.id) === categoryId)
                      ?.name ?? "All Categories")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {categoriesLoading ? "Loading..." : "All Categories"}
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categoriesError && (
            <p className="text-xs text-destructive">
              {categoriesError}{" "}
              <button
                type="button"
                onClick={refetchCategories}
                className="underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          )}
        </div>

        {/* Sort */}
        <SortSelect
          value={sort}
          onChange={onSortChange}
          showDefaultOption
          options={[
            "NAME_ASC",
            "NAME_DESC",
            "COST_ASC",
            "COST_DESC",
            "RETAIL_ASC",
            "RETAIL_DESC",
            "DATE_DESC",
            "DATE_ASC",
            "ID_ASC",
            "ID_DESC",
          ]}
          triggerClassName="w-[170px] !h-9 text-sm rounded-[2px]"
        />

        {/* Date Range */}
        {/* <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          inputClassName="h-9"
        /> */}

        {/* Add Product Button Slot (Furthest Right) */}
        {actionSlot && <div className="ml-auto shrink-0">{actionSlot}</div>}
      </div>
    </div>
  );
}
