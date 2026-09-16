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
import { PrintableInvoice } from "@/components/pos/PrintableInvoice";
import type { PaymentMethod, Receipt } from "@/lib/pos/receipt-types";
import { formatPeso } from "@/lib/pos/format-currency";

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
        <DialogContent className="sm:max-w-[440px] bg-card print:hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground">Sale completed</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Transaction saved successfully. You can print the receipt or start a
              new sale.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-medium text-foreground">
                {getInvoiceLabel(receipt)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground">
                {formatPeso(receipt.grand_total)}
              </span>
            </div>
            {primaryPayment ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium text-foreground">
                    {formatPaymentMethod(primaryPayment.payment_method)}
                  </span>
                </div>
                {primaryPayment.payment_method === "CASH" &&
                primaryPayment.change_given !== undefined ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Change</span>
                    <span className="font-medium text-foreground">
                      {formatPeso(primaryPayment.change_given)}
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handlePrint}>
              Print Receipt
            </Button>
            <Button type="button" onClick={handleNewSale}>
              New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div aria-hidden="true" className="hidden print:block">
        <PrintableInvoice receipt={receipt} />
      </div>
    </>
  );
}
