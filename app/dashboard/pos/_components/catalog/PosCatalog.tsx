"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2, RefreshCw, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "./ProductCard";
import {
  usePosCatalog,
  type CatalogProduct,
  type PosCatalogProps,
} from "@/lib/pos";

export type { CatalogProduct } from "@/lib/pos";

export function PosCatalog({
  searchInputRef,
  refreshTrigger,
  onAddToCart,
}: PosCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { products, categories, loading, error, refetch } = usePosCatalog({
    search: debouncedSearch,
    categoryId: selectedCategoryId,
  });
  // 2. Refetch stock counts whenever a transaction finishes
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  return (
    <div className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        {/* Barcode / Search Input */}
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-muted-foreground/80" />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search SKU..."
            className="pl-9 h-9 rounded-[4px] border-input focus-visible:ring-0 focus-visible:border-primary focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-[0_0_0_2px_rgba(0,96,178,0.2)]"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategoryId(undefined);
            }}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-input bg-muted/80 text-foreground">
              [F2]
            </span>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <Select
            value={
              selectedCategoryId === undefined
                ? "all"
                : String(selectedCategoryId)
            }
            onValueChange={(value) =>
              setSelectedCategoryId(value === "all" ? undefined : Number(value))
            }
          >
            <SelectTrigger
              className={`!h-9 w-[50%] min-w-[160px] max-w-[260px] rounded-[4px] text-[13px] ${
                selectedCategoryId !== undefined
                  ? "border-primary bg-primary text-primary-foreground [&_svg]:text-primary-foreground"
                  : ""
              }`}
            >
              <SelectValue placeholder="Select category">
                {(value: string | null) =>
                  !value || value === "all"
                    ? "All Categories"
                    : (categories.find(
                        (category) => String(category.id) === value,
                      )?.name ?? "Select category")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false}>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Product Catalog Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-input bg-muted/30 p-1"> 
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading products from inventory...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-foreground font-medium">
              Failed to load product catalog
            </p>
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="mt-2 gap-1.5 text-xs rounded-[4px]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            {searchQuery || selectedCategoryId !== undefined
              ? "No products match your search or filter."
              : "No products available in database."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {[...products]
              .sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                  sensitivity: "base",
                }),
              )
              .map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={onAddToCart}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
