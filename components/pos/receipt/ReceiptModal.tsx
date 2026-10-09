"use client";

// Post-checkout success modal with transaction summary, print trigger, and new sale action.
// Displays refund/exchange history sections when present in the receipt data.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintableInvoice } from "./PrintableInvoice";
import {
  formatPeso,
  formatReceiptDate,
  type PaymentMethod,
  type Receipt,
  type ReceiptReturn,
  type ReceiptExchange,
  computeTotalRefunds,
  computeTotalExchangeDifference,
  computeAdjustedTotal,
  hasAdjustments,
  getReceiptDisplayStatus,
} from "@/lib/pos";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onNewSale: () => void;
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

/** Formats an exchange price_difference for display. */
function formatPriceDifference(diff: number): string {
  if (diff === 0) return "Even swap";
  if (diff > 0) return `+${formatPeso(diff)} top-up`;
  return `${formatPeso(diff)}`;
}

export function ReceiptModal({
  open,
  onOpenChange,
  receipt,
  onNewSale,
}: ReceiptModalProps) {
  const primaryPayment = receipt.payments[0];
  const displayStatus = getReceiptDisplayStatus(receipt);
  const showAdjustments = hasAdjustments(receipt);
  const totalRefunds = computeTotalRefunds(receipt);
  const totalExchangeDiff = computeTotalExchangeDifference(receipt);
  const adjustedTotal = computeAdjustedTotal(receipt);

  /** Opens the browser print dialog for the hidden PrintableInvoice. */
  const handlePrint = () => {
    window.print();
  };

  /** Closes the modal and notifies the parent to start a new sale. */
  const handleNewSale = () => {
    onNewSale();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] bg-card print:hidden rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-foreground font-heading font-bold text-xl">Sale Completed</DialogTitle>
              {displayStatus === "FULL_REFUND" && (
                <Badge variant="destructive" className="text-[11px] font-mono font-semibold rounded-[2px]">FULLY REFUNDED</Badge>
              )}
              {displayStatus === "PARTIAL_RETURN" && (
                <Badge variant="destructive" className="text-[11px] font-mono font-semibold rounded-[2px] bg-destructive/10 text-destructive border border-destructive/30">PARTIAL RETURN</Badge>
              )}
              {displayStatus === "HAS_EXCHANGES" && (
                <Badge className="text-[11px] font-mono font-semibold rounded-[2px] bg-amber-100 text-amber-800 border border-amber-300">EXCHANGED</Badge>
              )}
            </div>
            <DialogDescription className="text-muted-foreground font-sans text-xs">
              Transaction saved successfully. You can print the receipt or start a
              new sale.
            </DialogDescription>
          </DialogHeader>

          {/* Transaction Summary */}
          <div className="rounded-[4px] border border-border bg-muted p-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono font-medium text-foreground">
                {getInvoiceLabel(receipt)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Total</span>
              <span className={`font-mono font-bold ${showAdjustments ? "line-through text-muted-foreground" : "text-primary"}`}>
                {formatPeso(receipt.grand_total)}
              </span>
            </div>
            {showAdjustments && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground font-medium">Adjusted Net Total</span>
                <span className="font-mono font-bold text-primary">
                  {formatPeso(adjustedTotal)}
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

          {/* Line Items with already_returned_qty annotations */}
          {receipt.items.some((item) => (item.already_returned_qty ?? 0) > 0) && (
            <div className="rounded-[4px] border border-border p-3 space-y-1.5 text-sm">
              <p className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-foreground">{item.product_name}</span>
                    {(item.already_returned_qty ?? 0) > 0 && (
                      <span className="ml-1.5 text-[11px] font-mono text-destructive">
                        ({item.already_returned_qty} returned)
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-foreground shrink-0">
                    {item.quantity} × {formatPeso(item.applied_price)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Returns Section */}
          {receipt.returns && receipt.returns.length > 0 && (
            <div className="rounded-[4px] border border-destructive/20 bg-destructive/5 p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <p className="text-xs font-heading font-semibold text-destructive uppercase tracking-wider">
                  Returns ({receipt.returns.length})
                </p>
              </div>
              {receipt.returns.map((ret: ReceiptReturn) => (
                <div key={ret.id} className="border-t border-destructive/10 pt-2 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-foreground">{ret.product_name}</span>
                    <span className="font-mono font-bold text-destructive shrink-0">
                      −{formatPeso(ret.refund_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>Qty: {ret.quantity} · {ret.defect_reason}</span>
                    <span className="font-mono shrink-0">{formatReceiptDate(ret.date)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Processed by: {ret.processed_by_staff}
                  </p>
                </div>
              ))}
              <div className="border-t border-destructive/20 pt-2 flex justify-between gap-2 font-medium">
                <span className="text-destructive text-xs uppercase tracking-wider">Total Refunds</span>
                <span className="font-mono font-bold text-destructive">
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
                <div key={exc.id} className="border-t border-amber-200 pt-2 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-foreground">{exc.product_name}</span>
                    <span className="font-mono font-bold text-amber-800 shrink-0">
                      {formatPriceDifference(exc.price_difference)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      Qty: {exc.quantity}
                      {exc.is_within_7_days && (
                        <Badge className="ml-1.5 text-[10px] font-mono rounded-[2px] bg-primary/10 text-primary border-0 px-1 py-0">
                          Within 7 days
                        </Badge>
                      )}
                    </span>
                    <span className="font-mono shrink-0">{formatReceiptDate(exc.date)}</span>
                  </div>
                </div>
              ))}
              {totalExchangeDiff !== 0 && (
                <div className="border-t border-amber-300/40 pt-2 flex justify-between gap-2 font-medium">
                  <span className="text-amber-800 text-xs uppercase tracking-wider">Net Exchange Diff</span>
                  <span className="font-mono font-bold text-amber-800">
                    {formatPriceDifference(totalExchangeDiff)}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handlePrint} className="rounded-[4px] text-xs">
              Print Receipt
            </Button>
            <Button type="button" onClick={handleNewSale} className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider">
              New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="print-only">
        <PrintableInvoice receipt={receipt} />
      </div>
    </>
  );
}
