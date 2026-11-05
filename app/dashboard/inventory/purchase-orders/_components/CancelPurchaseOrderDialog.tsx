// Confirmation dialog for cancelling a purchase order in the POS inventory module.
// Calls PATCH /purchase-orders/{id}/status with CANCELLED and shows backend 400/404/409 messages.
// Opened from the purchase orders table for PENDING orders only.
"use client";

import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePurchaseOrderStatus } from "@/lib/inventory/purchase-order-api";
import { PurchaseOrderDto } from "@/lib/inventory/purchase-order-types";
import { getErrorMessage } from "@/lib/utils";

interface CancelPurchaseOrderDialogProps {
  order: PurchaseOrderDto | null;
  onClose: () => void;
  onCancelled: (order: PurchaseOrderDto) => void;
}

// Renders the confirm dialog and performs the cancel request when confirmed.
export function CancelPurchaseOrderDialog({
  order,
  onClose,
  onCancelled,
}: CancelPurchaseOrderDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Clears the error and tells the page to close the dialog.
  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  // Sends the CANCELLED status update and reports the result.
  const handleConfirm = async () => {
    if (!order) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updatePurchaseOrderStatus(order.id, "CANCELLED");
      onCancelled(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to cancel the purchase order."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="rounded-md border border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel PO #{order?.id}?</DialogTitle>
          <DialogDescription>
            This cancels the order placed with{" "}
            <span className="font-semibold text-foreground break-words">
              {order?.supplierName}
            </span>
            . This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={handleClose}
          >
            Keep PO
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
