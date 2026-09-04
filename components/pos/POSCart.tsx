"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api";
import {
  POSCartItem,
  POSCustomer,
  PaymentEntry,
  PaymentMethod,
  PricingTier,
} from "@/lib/pos/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface POSCartProps {
  cart: POSCartItem[];
  selectedCustomer: POSCustomer | null;
  onUpdateQuantity: (productId: string | number, newQty: number) => void;
  onTogglePriceType: (productId: string | number, tier: PricingTier) => void;
  onUpdateDiscount: (productId: string | number, discount: number) => void;
  onRemoveItem: (productId: string | number) => void;
  onClearCart: () => void;
  onCheckoutSuccess?: (data: any) => void;
}

export function POSCart({
  cart,
  selectedCustomer,
  onUpdateQuantity,
  onTogglePriceType,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
}: POSCartProps) {
  // Retain key state across retries; only reset on success
  const [checkoutKey, setCheckoutKey] = useState(() => uuidv4());

  const [cashAmount, setCashAmount] = useState<string>("");
  const [gcashAmount, setGcashAmount] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute Cart Summary
  const subtotal = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );
  const totalDiscounts = cart.reduce(
    (acc, item) => acc + (item.discount || 0),
    0
  );
  const totalAmount = Math.max(0, subtotal - totalDiscounts);

  // Determine Overall Transaction Type
  const hasWholesaleItem = cart.some(
    (item) => item.selectedPriceType === "WHOLESALE"
  );
  const transactionType: PricingTier = hasWholesaleItem ? "WHOLESALE" : "RETAIL";

  const isWholesaleCustomer = selectedCustomer?.type === "WHOLESALE";

  // Compute Payments
  const parsedCash = parseFloat(cashAmount) || 0;
  const parsedGcash = parseFloat(gcashAmount) || 0;
  const parsedCredit = parseFloat(creditAmount) || 0;
  const totalPaid = parsedCash + parsedGcash + parsedCredit;
  const remainingBalance = totalAmount - totalPaid;

  const handleCheckout = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage("Cart is empty.");
      return;
    }

    if (parsedCredit > 0 && !isWholesaleCustomer) {
      setErrorMessage("Credit payments are strictly restricted to Wholesale Customers.");
      return;
    }

    if (totalPaid < totalAmount) {
      setErrorMessage(
        `Insufficient payment amount. Remaining balance: ₱${remainingBalance.toFixed(2)}`
      );
      return;
    }

    // Build Payments Array (Unique entries only)
    const payments: PaymentEntry[] = [];
    if (parsedCash > 0) payments.push({ method: "CASH", amount: parsedCash });
    if (parsedGcash > 0) payments.push({ method: "GCASH", amount: parsedGcash });
    if (parsedCredit > 0) payments.push({ method: "CREDIT", amount: parsedCredit });

    const payload = {
      customerId: selectedCustomer?.customerId ?? null,
      transactionType,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        priceType: item.selectedPriceType,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
      payments,
    };

    setLoading(true);

    try {
      const response = await apiClient.post("/pos/checkout", payload, {
        idempotency: checkoutKey,
      });

      // Reset state and key on successful transaction
      setCheckoutKey(uuidv4());
      setCashAmount("");
      setGcashAmount("");
      setCreditAmount("");
      onClearCart();

      if (onCheckoutSuccess) {
        onCheckoutSuccess(response.data);
      }
    } catch (error: any) {
      console.error("Checkout Failed:", error);
      setErrorMessage(
        error.response?.data?.message || "Checkout failed. Please retry."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg p-4 shadow-sm justify-between">
      <div>
        <div className="flex justify-between items-center pb-3 border-b mb-3">
          <h2 className="font-bold text-base">Current Cart</h2>
          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            Type: <strong className={transactionType === "WHOLESALE" ? "text-purple-600" : "text-blue-600"}>{transactionType}</strong>
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No items in cart. Select products to begin.
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="border rounded-md p-2.5 bg-background text-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-sm">{item.product.name}</span>
                    <p className="text-muted-foreground text-[11px]">
                      ₱{item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-destructive text-[11px] p-0"
                    onClick={() => onRemoveItem(item.product.id)}
                  >
                    Remove
                  </Button>
                </div>

                {/* Per Item Price Tier Selector */}
                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded">
                  <span className="text-muted-foreground text-[11px]">Pricing:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.selectedPriceType === "RETAIL" ? "default" : "outline"}
                    className="h-5 text-[10px] px-2"
                    onClick={() => onTogglePriceType(item.product.id, "RETAIL")}
                  >
                    Retail (₱{item.product.retail_price.toFixed(2)})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.selectedPriceType === "WHOLESALE" ? "default" : "outline"}
                    className="h-5 text-[10px] px-2 text-purple-700 border-purple-300"
                    onClick={() => onTogglePriceType(item.product.id, "WHOLESALE")}
                  >
                    Wholesale (₱{item.product.wholesale_price.toFixed(2)})
                  </Button>
                </div>

                {/* Quantity & Discount Controls */}
                <div className="flex justify-between items-center gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Qty:</span>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-14 h-6 text-xs text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Disc (₱):</span>
                    <Input
                      type="number"
                      min={0}
                      value={item.discount || ""}
                      placeholder="0"
                      onChange={(e) =>
                        onUpdateDiscount(item.product.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 h-6 text-xs text-right"
                    />
                  </div>

                  <span className="font-bold text-sm">
                    ₱{((item.unitPrice * item.quantity) - (item.discount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment & Checkout Section */}
      <div className="pt-4 border-t mt-4 space-y-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          {totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discounts</span>
              <span>-₱{totalDiscounts.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total Amount</span>
            <span>₱{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Multi-Payment Inputs */}
        <div className="space-y-2 bg-muted/30 p-2.5 rounded-md border text-xs">
          <p className="font-semibold text-muted-foreground">Payment Modes</p>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Cash (₱)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">GCash (₱)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={gcashAmount}
                onChange={(e) => setGcashAmount(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">
                Credit (₱) {!isWholesaleCustomer && "🔒"}
              </label>
              <Input
                type="number"
                placeholder="0.00"
                disabled={!isWholesaleCustomer}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="h-7 text-xs disabled:bg-muted"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2 text-xs bg-destructive/10 text-destructive rounded border border-destructive/20 font-medium">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={handleCheckout}
          disabled={loading || cart.length === 0}
          className="w-full font-bold h-10 text-sm"
        >
          {loading ? "Processing..." : `Complete Checkout (₱${totalAmount.toFixed(2)})`}
        </Button>
      </div>
    </div>
  );
}       