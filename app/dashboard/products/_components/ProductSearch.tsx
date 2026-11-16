"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  actionSlot?: ReactNode;
}

export function ProductSearch({
  searchTerm,
  onSearchChange,
  categoryId,
  onCategoryChange,
  actionSlot,
}: ProductSearchProps) {
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useProductCategories();

  return (
    <div className="w-full space-y-4">
      <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name, description, or SKU..."
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
            <SelectTrigger className="w-[260px] !h-9 text-sm">
              <SelectValue placeholder="All Categories">
                {categoriesLoading
                  ? "Loading..."
                  : categories.find((c) => String(c.id) === categoryId)?.name ??
                    "All Categories"}
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

        {/* Add Product Button Slot (Furthest Right) */}
        {actionSlot && (
          <div className="lg:col-start-5 flex lg:justify-end">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}