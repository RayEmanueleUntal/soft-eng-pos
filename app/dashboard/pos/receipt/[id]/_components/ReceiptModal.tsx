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
import type { Receipt } from "@/lib/pos";
import { PrintableInvoice } from "./PrintableInvoice";
import { ReceiptSummaryCard } from "./ReceiptSummaryCard";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onNewSale: () => void;
  /** When provided, shows a "Process Refund" button in the footer. */
  onProcessRefund?: () => void;
  /** When provided, shows a "Process Exchange" button in the footer. */
  onProcessExchange?: () => void;
}

export function ReceiptModal({
  open,
  onOpenChange,
  receipt,
  onNewSale,
  onProcessRefund,
  onProcessExchange,
}: ReceiptModalProps) {
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
        <DialogContent className="sm:max-w-[520px] bg-card print:hidden rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-heading font-bold text-xl">
              Sale Completed
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-sans text-xs">
              Transaction details. You can print the receipt or start a new
              sale.
            </DialogDescription>
          </DialogHeader>

          <ReceiptSummaryCard receipt={receipt} />

          <DialogFooter className="gap-2 mt-4">
            {onProcessRefund && (
              <Button
                type="button"
                variant="outline"
                onClick={onProcessRefund}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                Process Refund
              </Button>
            )}
            {onProcessExchange && (
              <Button
                type="button"
                variant="outline"
                onClick={onProcessExchange}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                Process Exchange
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="rounded-[4px] text-xs"
            >
              Print Receipt
            </Button>
            <Button
              type="button"
              onClick={handleNewSale}
              className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
            >
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
