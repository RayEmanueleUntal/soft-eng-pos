"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { PaymentModalItem } from "@/components/pos/PaymentModal";
import { formatPeso } from "@/lib/pos/format-currency";

interface PosCartProps {
  cart: PaymentModalItem[];
  cartTotal: number;
  onUpdateQuantity: (productId: string | number | undefined, delta: number) => void;
  onClearCart: () => void;
}

export function PosCart({
  cart,
  cartTotal,
  onUpdateQuantity,
  onClearCart,
}: PosCartProps) {
  return (
    <div className="lg:col-span-4 flex flex-col border border-input bg-card rounded-[4px] overflow-hidden shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
      <div className="h-8 border-b border-border flex justify-between items-center bg-muted px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase text-muted-foreground font-bold">
            Line Items ({cart.length})
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] text-destructive hover:text-destructive flex items-center gap-0.5 cursor-pointer font-bold uppercase font-mono"
          >
            <Trash2 className="h-3 w-3" /> Void
          </button>
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto bg-card">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-muted border-b border-border shadow-sm z-10">
            <tr>
              <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold w-full">
                Item
              </th>
              <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right">
                Qty
              </th>
              <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  Register is empty.
                </td>
              </tr>
            ) : (
              cart.map((item, idx) => (
                <tr
                  key={item.productId ?? item.id}
                  className={`group h-[32px] border-b border-border last:border-b-0 ${
                    idx % 2 === 0 ? "bg-card" : "bg-background"
                  } hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors`}
                >
                  <td className="px-2 py-1 max-w-[150px]">
                    <p className="font-medium text-foreground text-[12px] truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      @{formatPeso(item.unitPrice)}
                    </p>
                  </td>

                  {/* Quantity controls */}
                  <td className="px-2 py-1 align-top text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.productId ?? item.id, -1)
                        }
                        className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-[13px] font-mono font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.productId ?? item.id, 1)
                        }
                        className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </td>

                  <td className="px-2 py-1 text-right align-top">
                    <p className="font-semibold text-foreground font-mono text-[13px]">
                      {formatPeso(item.subtotal)}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
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
    </div>
  );
}
