"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  PackageSearch,
  RefreshCw,
  SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  // Refetch stock counts whenever a transaction finishes
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="lg:col-span-6 flex flex-col gap-2.5 overflow-hidden">
      {/* Search Input Row with Category Back Button */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-muted-foreground/80" />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search SKU or product name..."
            className="pl-9 pr-12 h-9 rounded-[4px] border-input focus-visible:ring-0 focus-visible:border-primary focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-[0_0_0_2px_rgba(0,96,178,0.2)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-input bg-muted/80 text-foreground">
              [F2]
            </span>
          </div>
        </div>

        {selectedCategory && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCategoryId(undefined)}
            className="h-9 px-3 rounded-[4px] text-xs font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 gap-1.5 transition-all shadow-none cursor-pointer"
            title="Back to all categories"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[150px]">{selectedCategory.name}</span>
          </Button>
        )}
      </div>

      {/* Product Catalog Grid / Categories Box */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-input bg-muted/30 p-1"> 
        {selectedCategoryId === undefined && !searchQuery ? (
          /* Categories Box at Starting Page */
          <div className="p-2.5 h-full overflow-y-auto">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground gap-2">
                <PackageSearch className="h-8 w-8 text-muted-foreground/40" />
                <p>No categories found in database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className="flex items-center justify-center p-4 min-h-[72px] rounded-[4px] border border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-xs transition-all text-center cursor-pointer active:scale-[0.98]"
                  >
                    <span className="font-heading font-bold text-xs sm:text-sm tracking-tight line-clamp-2">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
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
