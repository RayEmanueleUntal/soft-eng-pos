"use client";

import { Trash2 } from "lucide-react";
import type { PaymentModalItem } from "../payment/PaymentModal";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";

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
            className="text-[11px] text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#F87171] px-2 py-0.5 rounded-[2px] flex items-center gap-1 cursor-pointer font-bold uppercase font-mono transition-colors"
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
                <CartItemRow
                  key={item.productId ?? item.id}
                  item={item}
                  index={idx}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <CartSummary cartTotal={cartTotal} />
    </div>
  );
}