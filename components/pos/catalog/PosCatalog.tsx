"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Barcode, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { usePosCatalog, type CatalogProduct } from "@/lib/pos";

export type { CatalogProduct } from "@/lib/pos";

interface PosCatalogProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onAddToCart: (product: CatalogProduct) => void;
}

export function PosCatalog({ searchInputRef, onAddToCart }: PosCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { products, loading, error, refetch } = usePosCatalog();

  // Extract unique categories dynamically from loaded products
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [products]);

  // Real-time filtering by search query AND selected category
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        prod.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
      {/* Barcode / Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Barcode className="h-4 w-4 text-muted-foreground/80" />
        </div>
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Scan Barcode or Search SKU..."
          className="pl-9 h-9 rounded-[4px] border-input focus-visible:ring-0 focus-visible:border-primary focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-[0_0_0_2px_rgba(0,96,178,0.2)]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-input bg-muted/80 text-foreground">
            [F2]
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Catalog Grid */}
      <div className="overflow-y-auto flex-1 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading products from inventory...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-foreground font-medium">Failed to load product catalog</p>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2 gap-1.5 text-xs rounded-[4px]">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            {searchQuery || selectedCategory !== "All"
              ? "No products match your search or filter."
              : "No products available in database."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {filteredProducts.map((prod) => (
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