"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useProductCategories } from "@/lib/products/product-categories";

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
}

export function ProductSearch({
  searchTerm,
  onSearchChange,
  thread,
  onThreadChange,
  material,
  onMaterialChange,
  size,
  onSizeChange,
  categoryId,
  onCategoryChange,
}: ProductSearchProps) {
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useProductCategories();

  return (
    <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name, description, or SKU..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">
              {categoriesLoading ? "Loading..." : "All categories"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
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
      </div>
    </div>
  );
}
