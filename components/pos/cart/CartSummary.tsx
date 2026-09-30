"use client";

import { formatPeso } from "@/lib/pos";

interface CartSummaryProps {
  cartTotal: number;
}

export function CartSummary({ cartTotal }: CartSummaryProps) {
  return (
    <div className="p-2.5 border-t border-border bg-background shrink-0 space-y-1">
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>Subtotal</span>
        <span className="font-mono">{formatPeso(cartTotal)}</span>
      </div>
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>Tax (Included)</span>
        <span className="font-mono">₱0.00</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-input">
        <span>Grand Total</span>
        <span className="text-[18px] text-primary font-mono">
          {formatPeso(cartTotal)}
        </span>
      </div>
    </div>
  );
}
