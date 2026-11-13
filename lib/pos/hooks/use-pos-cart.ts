"use client";

import { useState } from "react";
import type { PaymentModalItem, CatalogProduct } from "@/lib/pos";
import type { BackendProductUom } from "@/lib/pos/types/pos-types";

const DEFAULT_INITIAL_CART: PaymentModalItem[] = [];

/**
 * Calculates line subtotal based on unit price, quantity, and fixed monetary line discount.
 * subtotal = max(0, quantity * unitPrice - line_discount)
 */
function calcLineSubtotal(
  quantity: number,
  unitPrice: number,
  lineDiscount: number = 0,
): { line_discount: number; subtotal: number } {
  const gross = Number((quantity * unitPrice).toFixed(2));
  const validDiscount = Math.max(0, Number(lineDiscount) || 0);
  const subtotal = Math.max(0, Number((gross - validDiscount).toFixed(2)));
  return {
    line_discount: validDiscount,
    subtotal,
  };
}

/**
 * Centralized price resolution for a cart line item at a given UoM.
 *
 * Resolution order:
 *  1. If targetUom === base_uom → return per-base-unit price (retailPrice / wholesalePrice).
 *  2. If targetUom matches an entry in item.uoms → return uom.retail_price (or uom.wholesale_price).
 *  3. Fallback: ratio conversion from base price × pricing_unit_qty.
 */
function resolveUomPrice(
  item: PaymentModalItem,
  targetUom: string,
  pricingType: "RETAIL" | "WHOLESALE" = item.pricingType || "RETAIL",
): number {
  const baseUom = (item.base_uom || "PCS").toUpperCase();
  const target = targetUom.toUpperCase();
  const isWholesale = pricingType === "WHOLESALE";

  // 1. Base UoM: return per-base-unit price
  if (target === baseUom) {
    return isWholesale
      ? Number(item.wholesalePrice ?? item.unitPrice ?? 0)
      : Number(item.retailPrice ?? item.unitPrice ?? 0);
  }

  // 2. Alternate UoM: look up backend-calculated or explicit price from uoms array
  const uoms = item.uoms ?? [];
  const entry = uoms.find(
    (u: BackendProductUom) => u.uom && u.uom.toUpperCase() === target,
  );

  if (entry) {
    const explicitPrice = isWholesale
      ? Number(
          entry.calculated_wholesale_price ??
            entry.wholesale_price ??
            entry.calculated_retail_price ??
            entry.retail_price ??
            entry.price ??
            0,
        )
      : Number(
          entry.calculated_retail_price ??
            entry.retail_price ??
            entry.price ??
            entry.calculated_wholesale_price ??
            entry.wholesale_price ??
            0,
        );
    if (explicitPrice > 0) return explicitPrice;
  }

  // 3. Fallback: ratio conversion from base price
  const basePrice = isWholesale
    ? Number(item.wholesalePrice ?? item.unitPrice ?? 0)
    : Number(item.retailPrice ?? item.unitPrice ?? 0);

  const entryFactor = entry
    ? Number(
        entry.conversion_factor ??
          entry.conversionFactor ??
          entry.multiplier ??
          0,
      )
    : 0;

  const factor =
    entryFactor > 0
      ? entryFactor
      : item.pricing_unit_qty && item.pricing_unit_qty > 0
        ? item.pricing_unit_qty
        : 1;

  return Number((basePrice * factor).toFixed(2));
}

export function usePosCart(
  initialCart: PaymentModalItem[] = DEFAULT_INITIAL_CART,
) {
  const [cart, setCart] = useState<PaymentModalItem[]>(initialCart);

  // Helper matcher to target the exact line item variant
  const isSameCartItem = (
    item: PaymentModalItem,
    productId: string | number | undefined,
    uom?: string,
  ) => {
    const matchId = (item.productId ?? item.id) === productId;
    if (!matchId) return false;

    // If uom is provided, match against unit_of_measure; otherwise match item id
    if (uom) {
      const currentUom =
        item.unit_of_measure || item.pricing_uom || item.base_uom || "PCS";
      return currentUom.toUpperCase() === uom.toUpperCase();
    }
    return true;
  };

  // Total of gross items before discount
  const itemsSubtotal = Number(
    cart
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      .toFixed(2),
  );

  // Total raw monetary line discount across all items
  const orderDiscountAmount = Number(
    cart.reduce((sum, item) => sum + (item.line_discount ?? 0), 0).toFixed(2),
  );

  // Net cart total
  const cartTotal = Math.max(
    0,
    Number(cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
  );

  // Backward-compatible dummy setter for deprecated percentage discount
  const orderDiscountPercent = 0;
  const setOrderDiscountPercent = (_percent: number) => {
    // Deprecated per issue specifications in favor of independent per-item raw monetary discount
  };

  // Update item quantity by delta (+1 / -1) or direct numeric value
  const updateQuantity = (
    productId: string | number | undefined,
    delta: number,
    uom?: string,
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (isSameCartItem(item, productId, uom)) {
            // For integer quantities or whole step changes, round cleanly to avoid float precision drift (e.g. 0.01)
            const rawQty = item.quantity + delta;
            const newQty = Number(Math.max(0, rawQty).toFixed(4));
            // If whole number, format as integer
            const cleanQty =
              Math.round(newQty * 100) % 100 === 0
                ? Math.round(newQty)
                : Number(newQty.toFixed(2));
            if (cleanQty <= 0) return null;

            const { line_discount, subtotal } = calcLineSubtotal(
              cleanQty,
              item.unitPrice,
              item.line_discount ?? 0,
            );

            return {
              ...item,
              quantity: cleanQty,
              line_discount,
              subtotal,
            };
          }
          return item;
        })
        .filter((item): item is PaymentModalItem => item !== null),
    );
  };

  // Direct numeric quantity setting
  const setItemQuantity = (
    productId: string | number | undefined,
    exactQty: number,
    uom?: string,
  ) => {
    // If numeric input is invalid or <= 0, keep item at minimum 1 instead of deleting/filtering out
    if (!exactQty || exactQty <= 0) return;

    setCart((prev) =>
      prev.map((item) => {
        if (isSameCartItem(item, productId, uom)) {
          const { line_discount, subtotal } = calcLineSubtotal(
            exactQty,
            item.unitPrice,
            item.line_discount ?? 0,
          );

          return {
            ...item,
            quantity: exactQty,
            line_discount,
            subtotal,
          };
        }
        return item;
      }),
    );
  };

  // Direct raw monetary discount setting (line_discount in cash value)
  const updateItemDiscount = (
    productId: string | number | undefined,
    discountAmount: number,
    uom?: string,
  ) => {
    const validDiscount = Math.max(0, Number(discountAmount) || 0);
    setCart((prev) =>
      prev.map((item) => {
        if (isSameCartItem(item, productId, uom)) {
          const { line_discount, subtotal } = calcLineSubtotal(
            item.quantity,
            item.unitPrice,
            validDiscount,
          );
          return {
            ...item,
            line_discount,
            subtotal,
          };
        }
        return item;
      }),
    );
  };

  // Switch item UoM directly in cart and recalculate unit price accordingly
  const updateItemUom = (
    productId: string | number | undefined,
    newUom: string,
    currentUom?: string,
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (isSameCartItem(item, productId, currentUom)) {
          const nextUnitPrice = resolveUomPrice(
            item,
            newUom,
            item.pricingType || "RETAIL",
          );

          const { line_discount, subtotal } = calcLineSubtotal(
            item.quantity,
            nextUnitPrice,
            item.line_discount ?? 0,
          );

          return {
            ...item,
            unit_of_measure: newUom,
            unitPrice: nextUnitPrice,
            line_discount,
            subtotal,
          };
        }
        return item;
      }),
    );
  };

  // Explicit item removal
  const removeItem = (productId: string | number | undefined, uom?: string) => {
    setCart((prev) =>
      prev.filter((item) => !isSameCartItem(item, productId, uom)),
    );
  };

  // Toggle single item pricing between RETAIL and WHOLESALE
  const toggleItemPricing = (
    productId: string | number | undefined,
    uom?: string,
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (isSameCartItem(item, productId, uom)) {
          const nextType: "RETAIL" | "WHOLESALE" =
            item.pricingType === "WHOLESALE" ? "RETAIL" : "WHOLESALE";

          const currentUom =
            item.unit_of_measure || item.pricing_uom || item.base_uom || "PCS";
          const nextUnitPrice = resolveUomPrice(item, currentUom, nextType);

          const { line_discount, subtotal } = calcLineSubtotal(
            item.quantity,
            nextUnitPrice,
            item.line_discount ?? 0,
          );

          return {
            ...item,
            pricingType: nextType,
            unitPrice: nextUnitPrice,
            line_discount,
            subtotal,
          };
        }
        return item;
      }),
    );
  };

  // Toggle all items in the cart to WHOLESALE or RETAIL
  const toggleAllPricing = (targetType: "RETAIL" | "WHOLESALE") => {
    setCart((prev) =>
      prev.map((item) => {
        const currentUom =
          item.unit_of_measure || item.pricing_uom || item.base_uom || "PCS";
        const nextUnitPrice = resolveUomPrice(item, currentUom, targetType);

        const { line_discount, subtotal } = calcLineSubtotal(
          item.quantity,
          nextUnitPrice,
          item.line_discount ?? 0,
        );

        return {
          ...item,
          pricingType: targetType,
          unitPrice: nextUnitPrice,
          line_discount,
          subtotal,
        };
      }),
    );
  };

  // Add product to cart
  const addItemToCart = (
    prod: CatalogProduct,
    preferredPricing?: "RETAIL" | "WHOLESALE",
  ) => {
    const pricingType = preferredPricing || "RETAIL";
    const selectedUom =
      prod.unit_of_measure || prod.pricing_uom || prod.base_uom || "PCS";

    const baseUom = prod.base_uom || "PCS";
    const pricingUom = prod.pricing_uom || prod.unit_of_measure || baseUom;
    const pricingUnitQty =
      prod.pricing_unit_qty && prod.pricing_unit_qty > 0
        ? prod.pricing_unit_qty
        : 1;

    const retail = Number(prod.retailPrice ?? prod.price);
    const wholesale = Number(prod.wholesalePrice ?? prod.price);

    const unitPrice = resolveUomPrice(
      {
        pricingType,
        base_uom: baseUom,
        pricing_uom: pricingUom,
        pricing_unit_qty: pricingUnitQty,
        retailPrice: retail,
        wholesalePrice: wholesale,
        uoms: prod.uoms,
      } as unknown as PaymentModalItem,
      selectedUom,
      pricingType,
    );

    setCart((prev) => {
      // Find existing item matching both productId AND unit_of_measure
      const existing = prev.find(
        (item) =>
          (item.productId ?? item.id) === prod.id &&
          (item.unit_of_measure || "").toUpperCase() ===
            selectedUom.toUpperCase(),
      );

      if (existing) {
        const newQty = existing.quantity + 1;
        const { line_discount, subtotal } = calcLineSubtotal(
          newQty,
          existing.unitPrice,
          existing.line_discount ?? 0,
        );
        return prev.map((item) =>
          item === existing
            ? {
                ...item,
                quantity: newQty,
                line_discount,
                subtotal,
              }
            : item,
        );
      }

      const { line_discount, subtotal } = calcLineSubtotal(1, unitPrice, 0);

      return [
        ...prev,
        {
          id: prod.id,
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          retailPrice: retail,
          wholesalePrice: wholesale,
          pricingType,
          unitPrice,
          line_discount,
          subtotal,
          unit_of_measure: selectedUom,
          base_uom: baseUom,
          pricing_uom: pricingUom,
          pricing_unit_qty: pricingUnitQty,
          current_quantity: prod.current_quantity,
          uoms: prod.uoms,
        },
      ];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    setCart,
    itemsSubtotal,
    cartTotal,
    cartCount: cart.length,
    orderDiscountPercent,
    orderDiscountAmount,
    setOrderDiscountPercent,
    addItemToCart,
    updateQuantity,
    setItemQuantity,
    updateItemDiscount,
    updateItemUom,
    removeItem,
    toggleItemPricing,
    toggleAllPricing,
    clearCart,
  };
}
