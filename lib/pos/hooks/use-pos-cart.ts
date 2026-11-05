"use client";

import { useState } from "react";
import type { PaymentModalItem, CatalogProduct } from "@/lib/pos";

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

export function usePosCart(
  initialCart: PaymentModalItem[] = DEFAULT_INITIAL_CART,
) {
  const [cart, setCart] = useState<PaymentModalItem[]>(initialCart);

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
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.productId ?? item.id) === productId) {
            // For integer quantities or whole step changes, round cleanly to avoid float precision drift (e.g. 0.01)
            const rawQty = item.quantity + delta;
            const newQty = Number(Math.max(0, rawQty).toFixed(4));
            // If whole number, format as integer
            const cleanQty = Math.round(newQty * 100) % 100 === 0 ? Math.round(newQty) : Number(newQty.toFixed(2));
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
  ) => {
    const validQty = Math.max(0, Number(exactQty) || 0);
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.productId ?? item.id) === productId) {
            if (validQty <= 0) return null;

            const { line_discount, subtotal } = calcLineSubtotal(
              validQty,
              item.unitPrice,
              item.line_discount ?? 0,
            );

            return {
              ...item,
              quantity: validQty,
              line_discount,
              subtotal,
            };
          }
          return item;
        })
        .filter((item): item is PaymentModalItem => item !== null),
    );
  };

  // Direct raw monetary discount setting (line_discount in cash value)
  const updateItemDiscount = (
    productId: string | number | undefined,
    discountAmount: number,
  ) => {
    const validDiscount = Math.max(0, Number(discountAmount) || 0);
    setCart((prev) =>
      prev.map((item) => {
        if ((item.productId ?? item.id) === productId) {
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
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.productId ?? item.id) === productId) {
          const baseUom = item.base_uom || "PCS";
          const pricingUom = item.pricing_uom || item.unit_of_measure || baseUom;
          const pricingUnitQty = item.pricing_unit_qty && item.pricing_unit_qty > 0 ? item.pricing_unit_qty : 1;

          const isPricingUom = newUom.toUpperCase() === pricingUom.toUpperCase();
          const baseRetail = Number(item.retailPrice ?? item.unitPrice ?? 0);
          const baseWholesale = Number(item.wholesalePrice ?? item.unitPrice ?? 0);

          const isWholesale = item.pricingType === "WHOLESALE";
          const chosenBasePrice = isWholesale ? baseWholesale : baseRetail;

          const nextUnitPrice = isPricingUom
            ? chosenBasePrice
            : Number((chosenBasePrice / pricingUnitQty).toFixed(2));

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
  const removeItem = (productId: string | number | undefined) => {
    setCart((prev) => prev.filter((item) => (item.productId ?? item.id) !== productId));
  };

  // Toggle single item pricing between RETAIL and WHOLESALE
  const toggleItemPricing = (productId: string | number | undefined) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.productId ?? item.id) === productId) {
          const nextType: "RETAIL" | "WHOLESALE" =
            item.pricingType === "WHOLESALE" ? "RETAIL" : "WHOLESALE";

          const baseUom = item.base_uom || "PCS";
          const pricingUom = item.pricing_uom || item.unit_of_measure || baseUom;
          const pricingUnitQty = item.pricing_unit_qty && item.pricing_unit_qty > 0 ? item.pricing_unit_qty : 1;
          const isPricingUom = (item.unit_of_measure || "").toUpperCase() === pricingUom.toUpperCase();

          const rawTargetPrice =
            nextType === "WHOLESALE"
              ? Number(item.wholesalePrice ?? item.unitPrice)
              : Number(item.retailPrice ?? item.unitPrice);

          const nextPrice = isPricingUom
            ? rawTargetPrice
            : Number((rawTargetPrice / pricingUnitQty).toFixed(2));

          const { line_discount, subtotal } = calcLineSubtotal(
            item.quantity,
            nextPrice,
            item.line_discount ?? 0,
          );

          return {
            ...item,
            pricingType: nextType,
            unitPrice: nextPrice,
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
        const baseUom = item.base_uom || "PCS";
        const pricingUom = item.pricing_uom || item.unit_of_measure || baseUom;
        const pricingUnitQty = item.pricing_unit_qty && item.pricing_unit_qty > 0 ? item.pricing_unit_qty : 1;
        const isPricingUom = (item.unit_of_measure || "").toUpperCase() === pricingUom.toUpperCase();

        const rawTargetPrice =
          targetType === "WHOLESALE"
            ? Number(item.wholesalePrice ?? item.unitPrice)
            : Number(item.retailPrice ?? item.unitPrice);

        const nextPrice = isPricingUom
          ? rawTargetPrice
          : Number((rawTargetPrice / pricingUnitQty).toFixed(2));

        const { line_discount, subtotal } = calcLineSubtotal(
          item.quantity,
          nextPrice,
          item.line_discount ?? 0,
        );

        return {
          ...item,
          pricingType: targetType,
          unitPrice: nextPrice,
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
    const selectedUom = prod.unit_of_measure || prod.pricing_uom || prod.base_uom || "PCS";

    const baseUom = prod.base_uom || "PCS";
    const pricingUom = prod.pricing_uom || prod.unit_of_measure || baseUom;
    const pricingUnitQty = prod.pricing_unit_qty && prod.pricing_unit_qty > 0 ? prod.pricing_unit_qty : 1;

    const isPricingUom = selectedUom.toUpperCase() === pricingUom.toUpperCase();

    const retail = Number(prod.retailPrice ?? prod.price);
    const wholesale = Number(prod.wholesalePrice ?? prod.price);
    const chosenRaw = pricingType === "WHOLESALE" ? wholesale : retail;

    const unitPrice = isPricingUom
      ? chosenRaw
      : Number((chosenRaw / pricingUnitQty).toFixed(2));

    setCart((prev) => {
      // Find existing item matching both productId AND unit_of_measure
      const existing = prev.find(
        (item) =>
          (item.productId ?? item.id) === prod.id &&
          (item.unit_of_measure || "").toUpperCase() === selectedUom.toUpperCase(),
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
