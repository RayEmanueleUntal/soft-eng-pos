"use client";

import { Minus, Plus } from "lucide-react";
import type { PaymentModalItem } from "../payment/PaymentModal";
import { formatPeso } from "@/lib/pos";

interface CartItemRowProps {
  item: PaymentModalItem;
  index: number;
  onUpdateQuantity: (productId: string | number | undefined, delta: number) => void;
}

export function CartItemRow({
  item,
  index,
  onUpdateQuantity,
}: CartItemRowProps) {
  return (
    <tr
      key={item.productId ?? item.id}
      className={`group h-[32px] border-b border-border last:border-b-0 ${
        index % 2 === 0 ? "bg-card" : "bg-background"
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
  );
}
