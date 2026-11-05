"use client";

import { Minus, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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
  onSetQuantity?: (
    productId: string | number | undefined,
    qty: number,
  ) => void;
  onUpdateDiscount?: (
    productId: string | number | undefined,
    discount: number,
  ) => void;
  onUpdateUom?: (
    productId: string | number | undefined,
    uom: string,
  ) => void;
  onRemoveItem?: (
    productId: string | number | undefined,
  ) => void;
  onTogglePricingType?: (productId: string | number | undefined) => void;
}

export function CartItemRow({
  item,
  index,
  isWholesaleCustomer = false,
  onUpdateQuantity,
  onSetQuantity,
  onUpdateDiscount,
  onUpdateUom,
  onRemoveItem,
  onTogglePricingType,
}: CartItemRowProps) {
  const isWholesalePrice = item.pricingType === "WHOLESALE";
  const itemId = item.productId ?? item.id;

  const baseUom = item.base_uom || "PCS";
  const pricingUom = item.pricing_uom || item.unit_of_measure || baseUom;
  const currentUom = item.unit_of_measure || pricingUom;
  const hasAlternateUom = baseUom.toUpperCase() !== pricingUom.toUpperCase();

  const handleQtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && onSetQuantity) {
      onSetQuantity(itemId, val);
    }
  };

  const handleDiscountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (onUpdateDiscount) {
      onUpdateDiscount(itemId, isNaN(val) ? 0 : val);
    }
  };

  return (
    <tr
      key={itemId}
      className={`group border-b border-border last:border-b-0 ${
        index % 2 === 0 ? "bg-card" : "bg-background"
      } hover:bg-accent/40 transition-colors`}
    >
      {/* Item info, pricing, UoM toggle, and discount field */}
      <td className="px-2 py-2 max-w-[170px]">
        <div className="flex items-center justify-between gap-1">
          <p className="font-medium text-foreground text-[12px] truncate leading-tight">
            {item.name}
          </p>
          {onRemoveItem && (
            <button
              type="button"
              onClick={() => onRemoveItem(itemId)}
              className="text-muted-foreground hover:text-destructive p-0.5 rounded-[2px] transition-colors"
              title="Remove item from cart"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-mono">
          <span className="tabular-nums">
            @{formatPeso(item.unitPrice)}
            <span className="text-[9px] text-muted-foreground">/{currentUom}</span>
          </span>

          {/* UoM Switcher if alternate exists */}
          {hasAlternateUom && onUpdateUom && (
            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-[2px] border border-border">
              <button
                type="button"
                onClick={() => onUpdateUom(itemId, baseUom)}
                className={`px-1 py-0.2 text-[8px] font-mono font-bold rounded-[2px] transition-colors ${
                  currentUom.toUpperCase() === baseUom.toUpperCase()
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Switch to Base unit (${baseUom})`}
              >
                {baseUom}
              </button>
              <button
                type="button"
                onClick={() => onUpdateUom(itemId, pricingUom)}
                className={`px-1 py-0.2 text-[8px] font-mono font-bold rounded-[2px] transition-colors ${
                  currentUom.toUpperCase() === pricingUom.toUpperCase()
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Switch to Pricing unit (${pricingUom})`}
              >
                {pricingUom}
              </button>
            </div>
          )}

          {/* Wholesale vs Retail Price Toggle with Switch Icon (only for wholesale customer) */}
          {isWholesaleCustomer && (
            <button
              type="button"
              onClick={() => onTogglePricingType?.(itemId)}
              className={`flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-[2px] border transition-colors cursor-pointer ${
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

        {/* Per-item monetary cash discount input */}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono">
          <span className="text-[10px]">Disc:</span>
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={(item.line_discount ?? 0) > 0 ? item.line_discount : ""}
              onChange={handleDiscountInputChange}
              className="w-14 h-4 px-1 font-mono text-[10px] rounded-[2px] border border-input bg-card focus:outline-none focus:border-primary text-foreground text-right tabular-nums"
              title="Per-item cash discount in Pesos"
            />
          </div>
        </div>
      </td>

      {/* Manual Quantity input & Step buttons */}
      <td className="px-2 py-2 align-middle text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onUpdateQuantity(itemId, -1)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card transition-colors"
            title="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={handleQtyInputChange}
            className="w-12 h-6 text-center text-[12px] font-mono font-medium text-foreground rounded-[2px] border border-input bg-card focus:outline-none focus:border-primary tabular-nums"
            title="Directly edit quantity"
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(itemId, 1)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card transition-colors"
            title="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* Subtotal */}
      <td className="px-2 py-2 text-right align-middle">
        <p className="font-semibold text-foreground font-mono text-[12px] tabular-nums whitespace-nowrap">
          {formatPeso(item.subtotal)}
        </p>
        {(item.line_discount ?? 0) > 0 && (
          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            -{formatPeso(item.line_discount!)}
          </p>
        )}
      </td>
    </tr>
  );
}
