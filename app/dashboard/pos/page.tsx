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
} from "@/components/pos";
import { usePosCart, usePosShortcuts, usePosCustomers, type Receipt } from "@/lib/pos";

const MOCK_SWAGGER_RECEIPT = {
  "transactionId": 101,
  "invoice_number": "INV-2026-0001",
  "date": "2026-08-28T00:00:00.000Z",
  "grand_total": 360,
  "transaction_type": "RETAIL" as const,
  "cashier_name": "Maria Santos",
  "customer": {
    "name": "Juan Dela Cruz",
    "number": "09171234567"
  },
  "items": [
    {
      "productId": 1,
      "product_name": "San Miguel Beer 330ml Can",
      "quantity": 6,
      "applied_price": 65,
      "subtotal": 390,
      "discounted_price": 360,
      "net_price": 360,
      "pricing_uom": "PCS",
      "type": "RETAIL" as const,
      "already_returned_qty": 2
    }
  ],
  "payments": [
    {
      "payment_method": "CASH" as const,
      "amount_paid": 500,
      "cash_tendered": 500,
      "change_given": 140,
      "reference_number": "GC-987654321",
      "gcash_mobile_number": "09123456789",
      "due_date": "2026-12-24T06:22:33.444Z",
      "remaining_credit_balance": 500
    }
  ],
  "returns": [
    {
      "id": 1,
      "productId": 12,
      "product_name": "Hex Bolt M8-1.25 x 30mm",
      "quantity": 2,
      "date": "2026-09-02T14:15:00.000Z",
      "defect_reason": "Damaged threads upon opening box",
      "refund_amount": 120,
      "processed_by_staff": "Juan Dela Cruz"
    }
  ],
  "exchanges": [
    {
      "id": 1,
      "productId": 15,
      "product_name": "Hex Bolt M10-1.50 x 40mm",
      "quantity": 2,
      "date": "2026-09-03T09:00:00.000Z",
      "price_difference": 45,
      "is_within_7_days": true
    }
  ]
};

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

  const selectedCustomer =
    customers.find((c) => String(c.id) === selectedCustomerId) ?? null;

  usePosShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onHold: () => alert("Hold function activated"),
    onCheckout: () => {
      if (cartTotal > 0) setIsCheckoutOpen(true);
    },
  });

  return (
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)]">
      <button onClick={() => setCompletedReceipt(MOCK_SWAGGER_RECEIPT as any)} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-white px-4 py-2 rounded font-bold shadow-lg">PREVIEW REFUND MODAL</button>
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
