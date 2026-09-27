"use client";

import { useState } from "react";
import type { PaymentModalItem } from "@/components/pos/PaymentModal";
import type { CatalogProduct } from "@/components/pos/PosCatalog";

const DEFAULT_INITIAL_CART: PaymentModalItem[] = [
  {
    id: 101,
    productId: 101,
    name: "Portland Cement Type 1 (40kg)",
    quantity: 10,
    unitPrice: 280.0,
    subtotal: 2800.0,
  },
  {
    id: 102,
    productId: 102,
    name: "Deformed Steel Bar 12mm x 6m",
    quantity: 20,
    unitPrice: 345.5,
    subtotal: 6910.0,
  },
];

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
