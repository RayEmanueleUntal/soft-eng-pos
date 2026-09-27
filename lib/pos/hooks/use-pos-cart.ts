"use client";

import { useState } from "react";
import type { PaymentModalItem, CatalogProduct } from "@/components/pos";

const DEFAULT_INITIAL_CART: PaymentModalItem[] = [];

export function usePosCart(initialCart: PaymentModalItem[] = DEFAULT_INITIAL_CART) {
  const [cart, setCart] = useState<PaymentModalItem[]>(initialCart);

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const updateQuantity = (
    productId: string | number | undefined,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.productId ?? item.id) === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter((item): item is PaymentModalItem => item !== null)
    );
  };

  const addItemToCart = (prod: CatalogProduct) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => (item.productId ?? item.id) === prod.id
      );
      if (existing) {
        return prev.map((item) =>
          (item.productId ?? item.id) === prod.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: prod.id,
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          subtotal: prod.price,
        },
      ];
    });
  };

  const clearCart = () => setCart([]);

  return {
    cart,
    setCart,
    cartTotal,
    cartCount: cart.length,
    addItemToCart,
    updateQuantity,
    clearCart,
  };
}
