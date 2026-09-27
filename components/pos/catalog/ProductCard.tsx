"use client";

import type { CatalogProduct } from "./PosCatalog";
import { formatPeso } from "@/lib/pos";

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div
      onClick={() => onAddToCart(product)}
      className="bg-card p-2.5 rounded-[4px] border border-border hover:border-primary transition-colors cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-1">
          <span className="text-[11px] font-mono text-muted-foreground">{product.sku}</span>
          <span className="text-[10px] px-1 py-0.5 rounded-[2px] bg-muted border border-border text-muted-foreground">
            {product.category}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-[13px] leading-tight line-clamp-2">{product.name}</h3>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold text-primary font-mono text-[13px]">{formatPeso(product.price)}</span>
      </div>
    </div>
  );
}
