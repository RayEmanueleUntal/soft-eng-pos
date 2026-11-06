"use client";

import { formatPeso } from "@/lib/pos";

interface CartSummaryProps {
  cartTotal: number;
  itemsSubtotal?: number;
  orderDiscountAmount?: number;
  // Kept for backward compatibility
  orderDiscountPercent?: number;
  onUpdateOrderDiscountPercent?: (percent: number) => void;
}

export function CartSummary({
  cartTotal,
  itemsSubtotal,
  orderDiscountAmount = 0,
}: CartSummaryProps) {
  const displaySubtotal = itemsSubtotal ?? cartTotal;

  return (
    <div className="p-2.5 border-t border-border bg-background shrink-0 space-y-1.5">
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>Subtotal</span>
        <span className="font-mono tabular-nums">{formatPeso(displaySubtotal)}</span>
      </div>

      {/* Item-level discounts summary */}
      {orderDiscountAmount > 0 && (
        <div className="flex justify-between text-[12px] text-emerald-600 dark:text-emerald-400">
          <span>Item Discounts</span>
          <span className="font-mono tabular-nums">-{formatPeso(orderDiscountAmount)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-input">
        <span>Grand Total</span>
        <span className="text-[18px] text-primary font-mono tabular-nums">
          {formatPeso(cartTotal)}
        </span>
      </div>
    </div>
  );
}
