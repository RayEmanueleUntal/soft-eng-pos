"use client";

import { useState, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  PosHeader,
  PosCatalog,
  PosCart,
  PosCommandBar,
  PaymentModal,
  ReceiptModal,
  type PaymentModalCustomer,
} from "@/components/pos";
import { usePosCart, usePosShortcuts, usePosCustomers, type Receipt } from "@/lib/pos";

export default function PosPage() {
  const { cart, cartTotal, addItemToCart, updateQuantity, clearCart } =
    usePosCart();
  const { customers, loading: isCustomersLoading } = usePosCustomers();

  // Default to Walk-in customer (ID "1" in database)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("1");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<Receipt | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomerData = customers.find(
    (c) => String(c.id) === String(selectedCustomerId)
  );
  const selectedCustomer: PaymentModalCustomer | null = selectedCustomerData
    ? {
        id: selectedCustomerData.id,
        name: selectedCustomerData.name,
        type: selectedCustomerData.type,
      }
    : null;

  usePosShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onHold: () => alert("Hold function activated"),
    onCheckout: () => {
      if (cartTotal > 0) setIsCheckoutOpen(true);
    },
  });

  return (
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)]">
      {/* 1. Top Header */}
      <PosHeader
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
        customers={customers}
        loading={isCustomersLoading}
      />

      {/* Success Notification Banner */}
      {lastCompletedSale && (
        <div className="mx-4 mt-4 flex items-center gap-2 text-xs font-sans font-medium text-emerald-800 bg-emerald-50 border border-emerald-300 p-2.5 rounded-[4px] shrink-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Last transaction (
            <span className="font-mono font-semibold">{lastCompletedSale}</span>
            ) completed successfully!
          </span>
        </div>
      )}

      {/* 2. Main Grid: Catalog and Cart */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 p-3 gap-3 overflow-hidden">
        {/* Left: Quick Catalog / Product Grid */}
        <PosCatalog
          searchInputRef={searchInputRef}
          onAddToCart={addItemToCart}
        />

        {/* Right: POS Cart & Checkout Trigger */}
        <PosCart
          cart={cart}
          cartTotal={cartTotal}
          onUpdateQuantity={updateQuantity}
          onClearCart={clearCart}
        />
      </div>

      {/* 3. Bottom Command Bar */}
      <PosCommandBar
        cartCount={cart.length}
        cartTotal={cartTotal}
        onFocusSearch={() => searchInputRef.current?.focus()}
        onHoldTransaction={() => alert("Hold function activated")}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* 4. Payment Recording Modal */}
      <PaymentModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartTotal={cartTotal}
        cartItems={cart}
        customer={selectedCustomer}
        onSuccess={(receipt) => {
          setLastCompletedSale(
            receipt.invoice_number ?? `#${receipt.transactionId}`
          );
          setCompletedReceipt(receipt);
          clearCart();
        }}
      />

      {/* 5. Post-Checkout Receipt Modal */}
      {completedReceipt && (
        <ReceiptModal
          open={!!completedReceipt}
          onOpenChange={(open) => {
            if (!open) setCompletedReceipt(null);
          }}
          receipt={completedReceipt}
          onNewSale={() => {
            setCompletedReceipt(null);
          }}
        />
      )}
    </div>
  );
}
