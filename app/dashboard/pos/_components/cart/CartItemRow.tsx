"use client";

import { Minus, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import type { PaymentModalItem } from "../payment/PaymentModal";
import { formatPeso } from "@/lib/pos";

interface CartItemRowProps {
  item: PaymentModalItem;
  index: number;
  isWholesaleCustomer?: boolean;
  onUpdateQuantity: (
    productId: string | number | undefined,
    delta: number,
  ) => void;
  onTogglePricingType?: (productId: string | number | undefined) => void;
}

export function CartItemRow({
  item,
  index,
  isWholesaleCustomer = false,
  onUpdateQuantity,
  onTogglePricingType,
}: CartItemRowProps) {
  const isWholesalePrice = item.pricingType === "WHOLESALE";

  return (
    <tr
      key={item.productId ?? item.id}
      className={`group h-[36px] border-b border-border last:border-b-0 ${
        index % 2 === 0 ? "bg-card" : "bg-background"
      } hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors`}
    >
      <td className="px-2 py-1 max-w-[150px]">
        <p className="font-medium text-foreground text-[12px] truncate leading-tight">
          {item.name}
        </p>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
          <span>@{formatPeso(item.unitPrice)}</span>

          {/* Wholesale vs Retail Price Toggle with Switch Icon (only for wholesale customer) */}
          {isWholesaleCustomer && (
            <button
              type="button"
              onClick={() => onTogglePricingType?.(item.productId ?? item.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-[2px] border transition-colors cursor-pointer ${
                isWholesalePrice
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-muted text-muted-foreground border-input hover:text-foreground"
              }`}
              title="Click to toggle between Retail and Wholesale price"
            >
              {isWholesalePrice ? (
                <ToggleRight className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              ) : (
                <ToggleLeft className="h-3 w-3 text-muted-foreground" />
              )}
              <span>{isWholesalePrice ? "WHOLESALE" : "RETAIL"}</span>
            </button>
          )}
        </div>
      </td>

      {/* Quantity controls */}
      <td className="px-2 py-1 align-middle text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => onUpdateQuantity(item.productId ?? item.id, -1)}
            className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-[12px] font-mono font-medium text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.productId ?? item.id, 1)}
            className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* Subtotal */}
      <td className="px-2 py-1 text-right align-middle">
        <p className="font-semibold text-foreground font-mono text-[12px]">
          {formatPeso(item.subtotal)}
        </p>
      </td>
    </tr>
  );
}
