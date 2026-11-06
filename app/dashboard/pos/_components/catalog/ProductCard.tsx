"use client";

import { useState } from "react";
import type { CatalogProduct } from "./PosCatalog";
import { formatPeso } from "@/lib/pos";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const baseUom = product.base_uom || "PCS";
  const pricingUom = product.pricing_uom || product.unit_of_measure || baseUom;
  const pricingUnitQty = product.pricing_unit_qty && product.pricing_unit_qty > 0 ? product.pricing_unit_qty : 1;

  // Show the switcher if the flat fields differ OR if the uoms array has any non-base entry
  const hasAlternateUom =
    baseUom.toUpperCase() !== pricingUom.toUpperCase() ||
    (product.uoms ?? []).some((u) => u.uom && u.uom.toUpperCase() !== baseUom.toUpperCase());

  const [selectedUom, setSelectedUom] = useState<string>(pricingUom);

  // Resolve the price for a given UoM directly from backend data:
  //   • For the base UoM → use product.retailPrice (retail_price from API, per base unit)
  //   • For an alternate UoM → use uoms[].retail_price if present, else multiply base × convFactor
  const baseRetailPrice = Number(product.retailPrice ?? product.price ?? 0);
  const baseWholesalePrice = Number(product.wholesalePrice ?? product.price ?? 0);

  const resolvePrice = (uom: string, basePrice: number): number => {
    if (uom.toUpperCase() === baseUom.toUpperCase()) return basePrice;
    const entry = (product.uoms ?? []).find(
      (u) => u.uom && u.uom.toUpperCase() === uom.toUpperCase()
    );
    if (!entry) return basePrice;
    // Prefer the backend-supplied price for this UoM
    const entryRetail = Number(entry.retail_price ?? entry.price ?? 0);
    if (entryRetail > 0) return entryRetail;
    // Fall back: multiply base-unit price by conversion factor
    const factor = Number(
      entry.conversion_factor ?? entry.conversionFactor ?? entry.multiplier ?? 1
    );
    return Number((basePrice * (factor || 1)).toFixed(2));
  };

  const displayPrice = resolvePrice(selectedUom, baseRetailPrice);
  const displayWholesalePrice = (() => {
    if (selectedUom.toUpperCase() === baseUom.toUpperCase()) return baseWholesalePrice;
    const entry = (product.uoms ?? []).find(
      (u) => u.uom && u.uom.toUpperCase() === selectedUom.toUpperCase()
    );
    if (!entry) return baseWholesalePrice;
    const entryWholesale = Number(entry.wholesale_price ?? 0);
    if (entryWholesale > 0) return entryWholesale;
    const entryRetail = Number(entry.retail_price ?? entry.price ?? 0);
    if (entryRetail > 0) return entryRetail;
    const factor = Number(entry.conversion_factor ?? entry.conversionFactor ?? entry.multiplier ?? 1);
    return Number((baseWholesalePrice * (factor || 1)).toFixed(2));
  })();

  // Conversion factor for stock display: how many base units = 1 of selectedUom
  const conversionFactor = (() => {
    if (selectedUom.toUpperCase() === baseUom.toUpperCase()) return 1;
    const entry = (product.uoms ?? []).find(
      (u) => u.uom && u.uom.toUpperCase() === selectedUom.toUpperCase()
    );
    if (entry) {
      const f = Number(entry.conversion_factor ?? entry.conversionFactor ?? entry.multiplier ?? 0);
      if (f > 0) return f;
    }
    return pricingUnitQty;
  })();

  // Compute dynamic stock availability: current_quantity / conversion_factor
  const totalBaseStock = typeof product.current_quantity === "number" ? product.current_quantity : 0;
  const rawAvailableStock = totalBaseStock / conversionFactor;
  const availableStock = conversionFactor > 1
    ? Number(rawAvailableStock.toFixed(2))
    : totalBaseStock;

  const isOutOfStock = totalBaseStock <= 0 || availableStock <= 0;

  const handleCardClick = () => {
    if (isOutOfStock) return;

    onAddToCart({
      ...product,
      unit_of_measure: selectedUom,
      price: displayPrice,
      retailPrice: displayPrice,
      wholesalePrice: displayWholesalePrice,
      current_quantity: totalBaseStock,
    });
  };

  const handleUomToggle = (e: React.MouseEvent, uom: string) => {
    e.stopPropagation();
    setSelectedUom(uom);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-card p-2.5 rounded-[4px] border transition-all flex flex-col justify-between ${
        isOutOfStock
          ? "border-destructive/30 bg-destructive/5 opacity-60 cursor-not-allowed select-none"
          : "border-border hover:border-primary cursor-pointer shadow-[0px_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm"
      }`}
    >
      <div>
        <div className="flex justify-between items-start gap-1.5 mb-1">
          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
            {product.sku}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 rounded-[2px] font-mono uppercase font-bold">
                Out of Stock
              </Badge>
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                Stock: <strong className="text-foreground">{availableStock}</strong>
              </span>
            )}
            {/* Always visible UoM pill badge */}
            <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-primary/10 border border-primary/20 text-primary font-mono font-bold uppercase">
              {selectedUom}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-muted border border-border text-muted-foreground truncate max-w-[70px]">
              {product.category}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-foreground text-[12px] leading-tight line-clamp-2">
          {product.name}
        </h3>
      </div>

      <div className="flex items-end justify-between gap-1.5 mt-2.5 pt-1.5 border-t border-border/40">
        <div>
          <span className="font-bold text-primary font-mono text-[13px] tabular-nums">
            {formatPeso(displayPrice)}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono ml-0.5">
            /{selectedUom}
          </span>
        </div>

        {/* UoM Switcher if alternate UoM exists */}
        {hasAlternateUom && (
          <div className="flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-[3px] border border-border" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => handleUomToggle(e, baseUom)}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-[2px] transition-colors ${
                selectedUom.toUpperCase() === baseUom.toUpperCase()
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={`Switch to Base unit (${baseUom})`}
            >
              {baseUom}
            </button>
            <button
              type="button"
              onClick={(e) => handleUomToggle(e, pricingUom)}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-[2px] transition-colors ${
                selectedUom.toUpperCase() === pricingUom.toUpperCase()
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={`Switch to Pricing unit (${pricingUom}) - 1 ${pricingUom} = ${pricingUnitQty} ${baseUom}`}
            >
              {pricingUom}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
