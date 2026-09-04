"use client";

import { useState } from "react";
import { CustomerSelector } from "@/components/pos/CustomerSelector";
import { ProductSearchGrid } from "@/components/pos/ProductSearchGrid";
import { POSCart } from "@/components/pos/POSCart";
import { POSCustomer, POSProduct, POSCartItem, PricingTier } from "@/lib/pos/types";

export default function POSPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<POSCustomer | null>(null);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddToCart = (product: POSProduct) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          selectedPriceType: "RETAIL",
          unitPrice: product.retail_price,
          discount: 0,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string | number, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleTogglePriceType = (productId: string | number, tier: PricingTier) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const unitPrice =
            tier === "WHOLESALE" ? item.product.wholesale_price : item.product.retail_price;
          return { ...item, selectedPriceType: tier, unitPrice };
        }
        return item;
      })
    );
  };

  const handleUpdateDiscount = (productId: string | number, discount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, discount } : item
      )
    );
  };

  const handleRemoveItem = (productId: string | number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckoutSuccess = () => {
    setSuccessMessage("Transaction completed successfully!");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)] p-4">
      {/* Left Column: Customer Selector & Product Catalog */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {successMessage && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
            {successMessage}
          </div>
        )}

        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />

        <div className="flex-1 overflow-y-auto bg-card border rounded-lg p-4 shadow-sm">
          <ProductSearchGrid onAddToCart={handleAddToCart} />
        </div>
      </div>

      {/* Right Column: POS Cart & Payment Sidebar */}
      <div className="w-full lg:w-[420px] h-full">
        <POSCart
          cart={cart}
          selectedCustomer={selectedCustomer}
          onUpdateQuantity={handleUpdateQuantity}
          onTogglePriceType={handleTogglePriceType}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      </div>
    </div>
  );
}