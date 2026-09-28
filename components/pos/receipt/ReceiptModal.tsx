"use client";

// Post-checkout success modal with transaction summary, print trigger, and new sale action.
// Receives receipt data via props; does not fetch from the backend.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "./PrintableInvoice";
import { formatPeso, type PaymentMethod, type Receipt } from "@/lib/pos";

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

export function ReceiptModal({
  open,
  onOpenChange,
  receipt,
  onNewSale,
}: ReceiptModalProps) {
  const primaryPayment = receipt.payments[0];

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
        <DialogContent className="sm:max-w-[440px] bg-card print:hidden rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-heading font-bold text-xl">Sale Completed</DialogTitle>
            <DialogDescription className="text-muted-foreground font-sans text-xs">
              Transaction saved successfully. You can print the receipt or start a
              new sale.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[4px] border border-border bg-muted p-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono font-medium text-foreground">
                {getInvoiceLabel(receipt)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-bold text-primary">
                {formatPeso(receipt.grand_total)}
              </span>
            </div>
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
