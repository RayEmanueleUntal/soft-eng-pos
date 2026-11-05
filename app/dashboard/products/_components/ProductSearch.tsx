"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="rounded-lg border bg-background p-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label>Search</Label>
          <Input
            placeholder="Search products or SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Thread</Label>
          <Input
            placeholder="e.g. M8x1.25"
            value={thread}
            onChange={(e) => onThreadChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Material</Label>
          <Input
            placeholder="e.g. Stainless"
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Size</Label>
          <Input
            placeholder="e.g. M8 x 30mm"
            value={size}
            onChange={(e) => onSizeChange(e.target.value)}
          />
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
