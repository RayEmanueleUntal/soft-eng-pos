"use client";

import { Minus, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { PaymentModalItem } from "../payment/PaymentModal";
import { formatPeso } from "@/lib/pos";
import { useEffect, useState } from "react";

interface CartItemRowProps {
  item: PaymentModalItem;
  index: number;
  isWholesaleCustomer?: boolean;
  onUpdateQuantity: (
    productId: string | number | undefined,
    delta: number,
    uom?: string,
  ) => void;
  onSetQuantity?: (
    productId: string | number | undefined,
    qty: number,
    uom?: string,
  ) => void;
  onUpdateDiscount?: (
    productId: string | number | undefined,
    discount: number,
    uom?: string,
  ) => void;
  onRemoveItem?: (productId: string | number | undefined, uom?: string) => void;
  onTogglePricingType?: (
    productId: string | number | undefined,
    uom?: string,
  ) => void;
}

// Prevent typing '-', '+', 'e', 'E'
const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

// Clean non-numeric input for quantity (positive numbers & optional decimal point)
const sanitizeDecimalInput = (val: string): string => {
  // Keeps only digits and a single decimal point
  let cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return cleaned;
};

export function CartItemRow({
  item,
  index,
  isWholesaleCustomer = false,
  onUpdateQuantity,
  onSetQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onTogglePricingType,
}: CartItemRowProps) {
  const isWholesalePrice = item.pricingType === "WHOLESALE";
  const itemId = item.productId ?? item.id;

  const baseUom = item.base_uom || "PCS";
  const pricingUom = item.pricing_uom || item.unit_of_measure || baseUom;
  const currentUom = item.unit_of_measure || pricingUom;
  const hasAlternateUom = baseUom.toUpperCase() !== pricingUom.toUpperCase();

  // Local state for quantity input
  const [qtyInput, setQtyInput] = useState<string>(String(item.quantity));
  useEffect(() => {
    setQtyInput(String(item.quantity));
  }, [item.quantity]);

  // Local state for discount input
  const [discountInput, setDiscountInput] = useState<string>(
    (item.line_discount ?? 0) > 0 ? String(item.line_discount) : "",
  );
  useEffect(() => {
    setDiscountInput(
      (item.line_discount ?? 0) > 0 ? String(item.line_discount) : "",
    );
  }, [item.line_discount]);

  const handleQtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeDecimalInput(e.target.value);
    setQtyInput(sanitized);

    const val = parseFloat(sanitized);
    if (!isNaN(val) && val > 0 && onSetQuantity) {
      onSetQuantity(itemId, val, currentUom);
    }
  };

  const handleQtyInputBlur = () => {
    if (qtyInput === "" || isNaN(parseFloat(qtyInput))) {
      setQtyInput(String(item.quantity));
    }
  };

  const handleDiscountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const sanitized = sanitizeDecimalInput(e.target.value);
    setDiscountInput(sanitized);

    const val = parseFloat(sanitized);
    if (onUpdateDiscount) {
      onUpdateDiscount(itemId, isNaN(val) ? 0 : val, currentUom);
    }
  };

  const handleDiscountInputBlur = () => {
    if (discountInput === "" || isNaN(parseFloat(discountInput))) {
      setDiscountInput(
        (item.line_discount ?? 0) > 0 ? String(item.line_discount) : "",
      );
    }
  };

  return (
    <tr
      key={`${itemId}-${currentUom}`}
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
              onClick={() => onRemoveItem(itemId, currentUom)}
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
            <span className="text-[9px] text-muted-foreground">
              /{currentUom}
            </span>
          </span>

          {/* Wholesale vs Retail Price Toggle with Switch Icon (only for wholesale customer) */}
          {isWholesaleCustomer && (
            <button
              type="button"
              onClick={() => onTogglePricingType?.(itemId, currentUom)}
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
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={discountInput}
              onKeyDown={handleNumberKeyDown}
              onChange={handleDiscountInputChange}
              onBlur={handleDiscountInputBlur}
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
            onClick={() => onUpdateQuantity(itemId, -1, currentUom)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card transition-colors"
            title="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={qtyInput}
            onChange={handleQtyInputChange}
            onBlur={handleQtyInputBlur}
            onKeyDown={handleNumberKeyDown}
            className="w-12 h-6 text-center text-[12px] font-mono font-medium text-foreground rounded-[2px] border border-input bg-card focus:outline-none focus:border-primary tabular-nums"
            title="Directly edit quantity"
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(itemId, 1, currentUom)}
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
