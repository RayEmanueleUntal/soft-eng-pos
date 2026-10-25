"use client";

import { formatPeso } from "@/lib/pos";

interface CartSummaryProps {
  cartTotal: number;
  itemsSubtotal?: number;
  orderDiscountPercent?: number;
  orderDiscountAmount?: number;
  onUpdateOrderDiscountPercent?: (percent: number) => void;
}

export function CartSummary({
  cartTotal,
  itemsSubtotal,
  orderDiscountPercent = 0,
  orderDiscountAmount = 0,
  onUpdateOrderDiscountPercent,
}: CartSummaryProps) {
  const displaySubtotal = itemsSubtotal ?? cartTotal;

  return (
    <div className="p-2.5 border-t border-border bg-background shrink-0 space-y-1.5">
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>Subtotal</span>
        <span className="font-mono">{formatPeso(displaySubtotal)}</span>
      </div>

      {/* Manual Order Discount (Percentage) */}
      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span className="text-[11px]">Order Discount (%)</span>
        <div className="flex items-center gap-1.5 font-mono">
          {orderDiscountAmount > 0 && (
            <span className="text-[10px] text-emerald-600">
              -{formatPeso(orderDiscountAmount)}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={orderDiscountPercent > 0 ? orderDiscountPercent : ""}
              onChange={(e) =>
                onUpdateOrderDiscountPercent?.(Number(e.target.value))
              }
              className="w-12 h-5 px-1 text-center font-mono text-[11px] rounded-[2px] border border-input bg-card focus:outline-none focus:border-primary text-foreground"
            />
            <span className="text-[11px] text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>Tax (Included)</span>
        <span className="font-mono">₱0.00</span>
      </div>

      <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-input">
        <span>Grand Total</span>
        <span className="text-[18px] text-primary font-mono">
          {formatPeso(cartTotal)}
        </span>
      </div>
    </div>
  );
}
