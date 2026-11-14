// Modal that moves a shipment one step forward: PENDING -> DISPATCHED -> DELIVERED.
// Calls PATCH /shipments/{id}/status. Only the next valid step is offered, so skips and edits to
// DELIVERED shipments are blocked in the UI; backend 400/404 messages are still shown if they occur.
"use client";

import * as React from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { updateShipmentStatus } from "@/lib/inventory/shipment-api";
import { Shipment } from "@/lib/inventory/shipment-types";
import { getNextStatus } from "@/lib/inventory/shipment-utils";
import { getErrorMessage } from "@/lib/utils";

const NOTES_MAX = 500;

interface UpdateShipmentStatusModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onUpdated: (shipment: Shipment) => void;
}

export function UpdateShipmentStatusModal({
  shipment,
  onClose,
  onUpdated,
}: UpdateShipmentStatusModalProps) {
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Clears the form each time a different shipment is opened.
  React.useEffect(() => {
    setNotes("");
    setError(null);
  }, [shipment?.id]);

  const nextStatus = shipment ? getNextStatus(shipment.tracking_status) : null;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment || !nextStatus) return;

    // The backend stores each status note as one log line, so line breaks are flattened.
    const cleanNotes = notes.replace(/\s*\n\s*/g, " ").trim();
    if (cleanNotes.length > NOTES_MAX) {
      setError(`Notes must be ${NOTES_MAX} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateShipmentStatus(shipment.id, {
        status: nextStatus,
        ...(cleanNotes ? { notes: cleanNotes } : {}),
      });
      onUpdated(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update the shipment status."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={shipment !== null}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="rounded-md border border-border p-5 sm:max-w-md">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="font-heading text-base font-bold tracking-tight">
            Update Shipment #{shipment?.id}
          </DialogTitle>
          <DialogDescription className="break-words">
            {shipment?.transaction?.invoice_number ??
              `Order #${shipment?.transactionId}`}
            {shipment?.forwarder ? ` via ${shipment.forwarder.company_name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {shipment && nextStatus ? (
          <form onSubmit={handleConfirm} className="space-y-4 pt-1">
            <div className="flex items-center justify-center gap-3 rounded-md border border-border bg-muted/40 py-3">
              <ShipmentStatusBadge status={shipment.tracking_status} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <ShipmentStatusBadge status={nextStatus} />
            </div>

            {nextStatus === "DELIVERED" && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800">
                Delivered is final. The shipment moves to History and can no
                longer be edited.
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="status-notes"
                className="text-xs text-muted-foreground"
              >
                Status note (optional)
              </Label>
              <Textarea
                id="status-notes"
                value={notes}
                maxLength={NOTES_MAX}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  nextStatus === "DISPATCHED"
                    ? "e.g. Handed over to courier driver"
                    : "e.g. Received by customer"
                }
                className="min-h-[72px] text-xs"
                disabled={submitting}
              />
              <p className="text-right font-mono text-[10px] text-muted-foreground">
                {notes.length}/{NOTES_MAX}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Mark as {nextStatus === "DISPATCHED" ? "Dispatched" : "Delivered"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="pt-1 text-xs text-muted-foreground">
            This shipment is already delivered and cannot be changed.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}