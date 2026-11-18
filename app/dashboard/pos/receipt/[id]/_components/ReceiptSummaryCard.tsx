"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatPeso,
  formatReceiptDate,
  type PaymentMethod,
  type Receipt,
  type ReceiptReturn,
  type ReceiptExchange,
  computeTotalRefunds,
  hasAdjustments,
  getReceiptDisplayStatus,
} from "@/lib/pos";

interface ReceiptSummaryCardProps {
  receipt: Receipt;
  className?: string;
}

/** Builds invoice label from invoice_number with transactionId fallback. */
function getInvoiceLabel(receipt: Receipt): string {
  return receipt.invoice_number ?? `#${receipt.transactionId}`;
}

/** Maps backend payment method enum to a readable label. */
function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "GCASH":
      return "GCash";
    case "CREDIT":
      return "Credit";
    default:
      return method;
  }
}

export function ReceiptSummaryCard({
  receipt,
  className,
}: ReceiptSummaryCardProps) {
  const primaryPayment = receipt.payments[0];
  const displayStatus = getReceiptDisplayStatus(receipt);
  const showAdjustments = hasAdjustments(receipt);
  const totalRefunds = computeTotalRefunds(receipt);
  const adjustedNetTotal = Math.max(
    0,
    Number((receipt.grand_total - totalRefunds).toFixed(2)),
  );

  return (
    <div className={`space-y-4 max-w-lg mx-auto ${className || ""}`}>
      {/* Header Badges */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-heading font-bold text-lg">
            Transaction Summary
          </span>
          {displayStatus === "FULL_REFUND" && (
            <Badge
              variant="destructive"
              className="text-[11px] font-mono font-semibold rounded-[2px]"
            >
              FULLY REFUNDED
            </Badge>
          )}
          {displayStatus === "PARTIAL_RETURN" && (
            <Badge
              variant="destructive"
              className="text-[11px] font-mono font-semibold rounded-[2px] bg-destructive/10 text-destructive border border-destructive/30"
            >
              PARTIAL REFUND
            </Badge>
          )}
          {displayStatus === "HAS_EXCHANGES" && (
            <Badge className="text-[11px] font-mono font-semibold rounded-[2px] bg-amber-100 text-amber-800 border border-amber-300">
              EXCHANGED
            </Badge>
          )}
        </div>
      </div>

      {/* Transaction Summary Card */}
      <div className="rounded-[4px] border border-border bg-muted p-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Invoice</span>
          <span className="font-mono font-medium text-foreground">
            {getInvoiceLabel(receipt)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Total</span>
          <span
            className={` font-bold ${
              showAdjustments
                ? "line-through text-muted-foreground"
                : "text-primary"
            }`}
          >
            {formatPeso(receipt.grand_total)}
          </span>
        </div>
        {showAdjustments && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground font-medium">
              {displayStatus === "FULL_REFUND"
                ? "FULLY REFUNDED"
                : "Adjusted Net Total"}
            </span>
            <span className="font-bold text-primary">
              {formatPeso(adjustedNetTotal)}
            </span>
          </div>
        )}
        {primaryPayment ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium text-foreground">
                {formatPaymentMethod(primaryPayment.payment_method)}
              </span>
            </div>
            {primaryPayment.payment_method === "CASH" &&
            primaryPayment.change_given !== undefined ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Change</span>
                <span className="font-mono font-medium text-foreground">
                  {formatPeso(primaryPayment.change_given)}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Line Items with UoM and already_returned_qty annotations */}
      <div className="rounded-[4px] border border-border p-3 space-y-1.5 text-sm bg-card">
        <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
          Items
        </p>
        {receipt.items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between gap-2 items-start py-1 border-b border-border/40 last:border-0"
          >
            <div className="min-w-0">
              <span className="text-foreground font-medium">
                {item.product_name}
              </span>
              {(item.already_returned_qty ?? 0) > 0 && (
                <span className="ml-1.5 text-[11px] font-mono text-destructive">
                  ({item.already_returned_qty} returned)
                </span>
              )}
              {item.pricing_uom && (
                <div className="text-[11px] text-muted-foreground font-mono">
                  UoM: {item.pricing_uom}
                </div>
              )}
            </div>
            <span className=" text-foreground shrink-0 tabular-nums">
              {item.quantity} {item.pricing_uom ? item.pricing_uom : ""} ×{" "}
              {formatPeso(item.applied_price)}
            </span>
          </div>
        ))}
      </div>

      {/* Returns Section */}
      {receipt.returns && receipt.returns.length > 0 && (
        <div className="rounded-[4px] border border-destructive/20 bg-destructive/5 p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <p className="text-xs font-heading font-semibold text-destructive uppercase tracking-wider">
              Returns ({receipt.returns.length})
            </p>
          </div>
          {receipt.returns.map((ret: ReceiptReturn) => (
            <div
              key={ret.id}
              className="border-t border-destructive/10 pt-2 space-y-1"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium text-foreground">
                  {ret.product_name}
                </span>
                <span className="font-mono font-bold text-destructive shrink-0">
                  −{formatPeso(Number(ret.refund_amount) || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Qty: {ret.quantity}
                  {/* {ret.pricing_uom ? ` ${ret.pricing_uom}` : ""} ·{" "} */}
                  {" · "}
                  {ret.condition === "CHANGE_OF_MIND"
                    ? "Change of Mind"
                    : "Defective"}{" "}
                  · {ret.defect_reason}
                </span>
                <span className="font-mono shrink-0">
                  {formatReceiptDate(ret.date)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Processed by: {ret.processed_by_staff}
              </p>
            </div>
          ))}
          <div className="border-t border-destructive/20 pt-2 flex justify-between gap-2 font-medium">
            <span className="text-destructive text-xs uppercase tracking-wider">
              Total Refunds
            </span>
            <span className=" font-bold text-destructive">
              −{formatPeso(totalRefunds)}
            </span>
          </div>
        </div>
      )}

      {/* Exchanges Section */}
      {receipt.exchanges && receipt.exchanges.length > 0 && (
        <div className="rounded-[4px] border border-amber-300/40 bg-amber-50 p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <p className="text-xs font-heading font-semibold text-amber-800 uppercase tracking-wider">
              Exchanges ({receipt.exchanges.length})
            </p>
          </div>
          {receipt.exchanges.map((exc: ReceiptExchange) => (
            <div
              key={exc.id}
              className="border-t border-amber-200 pt-2 space-y-1"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium text-foreground">
                  {exc.product_name}
                </span>
                <span className="font-mono font-bold text-amber-800 shrink-0">
                  1:1 Replacement
                </span>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>Qty: {exc.quantity}</span>
                <span className="font-mono shrink-0">
                  {formatReceiptDate(exc.date)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Processed by: {exc.processed_by_staff}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
