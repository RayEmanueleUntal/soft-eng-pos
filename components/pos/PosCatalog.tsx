"use client";

import { useState } from "react";
import { Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPeso } from "@/lib/pos/format-currency";

export interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  category: string;
}

export const SAMPLE_PRODUCTS: CatalogProduct[] = [
  { id: 101, name: "Portland Cement Type 1 (40kg)", sku: "CEM-001", price: 280.0, category: "Masonry" },
  { id: 102, name: "Deformed Steel Bar 12mm x 6m", sku: "STL-012", price: 345.5, category: "Steel" },
  { id: 103, name: "Hex Bolt M8 x 30mm (Box of 50)", sku: "FST-0830", price: 175.0, category: "Fasteners" },
  { id: 104, name: "Heavy Duty Angle Grinder 4-inch", sku: "TLS-004", price: 2850.0, category: "Power Tools" },
  { id: 105, name: "Gloss Latex Paint White (4L)", sku: "PNT-004L", price: 620.0, category: "Paints" },
  { id: 106, name: "Galvanized Iron Wire #16", sku: "WR-016", price: 85.0, category: "Wire" },
];

interface PosCatalogProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onAddToCart: (product: CatalogProduct) => void;
}

export function PosCatalog({ searchInputRef, onAddToCart }: PosCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = SAMPLE_PRODUCTS.filter(
    (prod) =>
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
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

      <div className="overflow-y-auto flex-1 pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onAddToCart(prod)}
              className="bg-card p-2.5 rounded-[4px] border border-border hover:border-primary transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-[11px] font-mono text-muted-foreground">{prod.sku}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded-[2px] bg-muted border border-border text-muted-foreground">
                    {prod.category}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-[13px] leading-tight line-clamp-2">{prod.name}</h3>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-primary font-mono text-[13px]">{formatPeso(prod.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
