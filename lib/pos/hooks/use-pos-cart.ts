"use client";

import { useState } from "react";
import type { PaymentModalItem, CatalogProduct } from "@/lib/pos";

const DEFAULT_INITIAL_CART: PaymentModalItem[] = [];

// Helper to calculate line items with distributed order discount percentage
function calcLinePricing(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
) {
  const gross = quantity * unitPrice;
  const validPercent = Math.min(
    100,
    Math.max(0, isNaN(discountPercent) ? 0 : discountPercent),
  );
  const discountAmount = Number((gross * (validPercent / 100)).toFixed(2));
  const subtotal = Math.max(0, Number((gross - discountAmount).toFixed(2)));
  return {
    line_discount: discountAmount,
    subtotal,
  };
}

export function usePosCart(
  initialCart: PaymentModalItem[] = DEFAULT_INITIAL_CART,
) {
  const [cart, setCart] = useState<PaymentModalItem[]>(initialCart);
  const [orderDiscountPercent, setRawDiscountPercent] = useState<number>(0);

  // Total of gross items before discount
  const itemsSubtotal = Number(
    cart
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      .toFixed(2),
  );

  // Total discount amount across all items
  const orderDiscountAmount = Number(
    cart.reduce((sum, item) => sum + (item.line_discount ?? 0), 0).toFixed(2),
  );

  // Net cart total
  const cartTotal = Math.max(
    0,
    Number((itemsSubtotal - orderDiscountAmount).toFixed(2)),
  );

  // Update order discount percentage and distribute across all current line items
  const setOrderDiscountPercent = (percent: number) => {
    const validPercent = Math.min(
      100,
      Math.max(0, isNaN(percent) ? 0 : percent),
    );
    setRawDiscountPercent(validPercent);
    setCart((prev) =>
      prev.map((item) => {
        const { line_discount, subtotal } = calcLinePricing(
          item.quantity,
          item.unitPrice,
          validPercent,
        );
        return {
          ...item,
          line_discount,
          subtotal,
        };
      }),
    );
  };

  // Update item quantity
  const updateQuantity = (
    productId: string | number | undefined,
    delta: number,
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.productId ?? item.id) === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;

            const { line_discount, subtotal } = calcLinePricing(
              newQty,
              item.unitPrice,
              orderDiscountPercent,
            );

            return {
              ...item,
              quantity: newQty,
              line_discount,
              subtotal,
            };
          }
          return item;
        })
        .filter((item): item is PaymentModalItem => item !== null),
    );
  };

  // Toggle single item pricing between RETAIL and WHOLESALE
  const toggleItemPricing = (productId: string | number | undefined) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.productId ?? item.id) === productId) {
          const nextType: "RETAIL" | "WHOLESALE" =
            item.pricingType === "WHOLESALE" ? "RETAIL" : "WHOLESALE";
          const nextPrice =
            nextType === "WHOLESALE"
              ? Number(item.wholesalePrice ?? item.unitPrice)
              : Number(item.retailPrice ?? item.unitPrice);

          const { line_discount, subtotal } = calcLinePricing(
            item.quantity,
            nextPrice,
            orderDiscountPercent,
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
        const nextPrice =
          targetType === "WHOLESALE"
            ? Number(item.wholesalePrice ?? item.unitPrice)
            : Number(item.retailPrice ?? item.unitPrice);

        const { line_discount, subtotal } = calcLinePricing(
          item.quantity,
          nextPrice,
          orderDiscountPercent,
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
    const retail = Number(prod.retailPrice ?? prod.price);
    const wholesale = Number(prod.wholesalePrice ?? prod.price);
    const price = pricingType === "WHOLESALE" ? wholesale : retail;

    setCart((prev) => {
      const existing = prev.find(
        (item) => (item.productId ?? item.id) === prod.id,
      );
      if (existing) {
        const newQty = existing.quantity + 1;
        const { line_discount, subtotal } = calcLinePricing(
          newQty,
          existing.unitPrice,
          orderDiscountPercent,
        );
        return prev.map((item) =>
          (item.productId ?? item.id) === prod.id
            ? {
                ...item,
                quantity: newQty,
                line_discount,
                subtotal,
              }
            : item,
        );
      }

      const { line_discount, subtotal } = calcLinePricing(
        1,
        price,
        orderDiscountPercent,
      );

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
          unitPrice: price,
          line_discount,
          subtotal,
          unit_of_measure: prod.unit_of_measure,
        },
      ];
    });
  };

  const clearCart = () => {
    setCart([]);
    setRawDiscountPercent(0);
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
    toggleItemPricing,
    toggleAllPricing,
    clearCart,
  };
}
