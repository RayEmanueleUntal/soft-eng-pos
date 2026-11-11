// Modal for logging a new outbound shipment (POST /shipments).
// Lets staff pick a completed order (GET /transactions) and an active forwarder (GET /forwarders),
// plus an optional waybill number and delivery notes. Shows backend 400/404/409 messages inline.
"use client";

import * as React from "react";
import axios from "axios";
import { AlertCircle, AlertTriangle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createShipment,
  fetchActiveForwarders,
  fetchEligibleTransactions,
} from "@/lib/inventory/shipment-api";
import {
  EligibleTransaction,
  Forwarder,
  Shipment,
} from "@/lib/inventory/shipment-types";
import { cn, formatPeso, getErrorMessage } from "@/lib/utils";

const TRACKING_MAX = 100;
const NOTES_MAX = 500;

interface CreateShipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (shipment: Shipment) => void;
}

// True when the order already has a PENDING or DISPATCHED shipment (backend would answer 409).
function hasActiveShipment(transaction: EligibleTransaction): boolean {
  return (transaction.shipments ?? []).some(
    (shipment) => shipment.tracking_status !== "DELIVERED",
  );
}

export function CreateShipmentModal({
  open,
  onOpenChange,
  onCreated,
}: CreateShipmentModalProps) {
  // Transaction picker
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [transactions, setTransactions] = React.useState<EligibleTransaction[]>(
    [],
  );
  const [txLoading, setTxLoading] = React.useState(false);
  const [txError, setTxError] = React.useState<string | null>(null);
  const [selectedTx, setSelectedTx] =
    React.useState<EligibleTransaction | null>(null);

  // Forwarder selector
  const [forwarders, setForwarders] = React.useState<Forwarder[]>([]);
  const [forwarderId, setForwarderId] = React.useState("");
  const [forwardersLoading, setForwardersLoading] = React.useState(false);
  const [forwardersError, setForwardersError] = React.useState<string | null>(
    null,
  );

  // Optional fields and submit state
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState<string | null>(null);

  // Resets the form every time the modal opens and loads active forwarders.
  React.useEffect(() => {
    if (!open) return;

    setSearch("");
    setQuery("");
    setSelectedTx(null);
    setForwarderId("");
    setTrackingNumber("");
    setNotes("");
    setError(null);
    setConflict(null);

    let cancelled = false;
    setForwardersLoading(true);
    setForwardersError(null);
    fetchActiveForwarders()
      .then((res) => {
        if (!cancelled) setForwarders(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setForwarders([]);
          setForwardersError(getErrorMessage(err, "Failed to load forwarders."));
        }
      })
      .finally(() => {
        if (!cancelled) setForwardersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Debounces the search box so the orders list is not fetched on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Loads completed orders matching the search (invoice number or customer name).
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setTxLoading(true);
    setTxError(null);
    fetchEligibleTransactions(query)
      .then((res) => {
        if (!cancelled) setTransactions(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setTransactions([]);
          setTxError(getErrorMessage(err, "Failed to load completed orders."));
        }
      })
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, query]);

  const handleClose = (nextOpen: boolean) => {
    if (submitting) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflict(null);

    if (!selectedTx) {
      setError("Select a completed order to ship.");
      return;
    }
    if (!forwarderId) {
      setError("Select a forwarder.");
      return;
    }
    if (trackingNumber.trim().length > TRACKING_MAX) {
      setError(`Tracking number must be ${TRACKING_MAX} characters or fewer.`);
      return;
    }
    if (notes.trim().length > NOTES_MAX) {
      setError(`Notes must be ${NOTES_MAX} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createShipment({
        transactionId: selectedTx.id,
        forwarderId: Number(forwarderId),
        ...(trackingNumber.trim()
          ? { tracking_number: trackingNumber.trim() }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onOpenChange(false);
      onCreated(created);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to create the shipment.");
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflict(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const noForwarders =
    !forwardersLoading && !forwardersError && forwarders.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-md border border-border p-5 sm:max-w-[540px]">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="font-heading text-base font-bold tracking-tight">
            Log New Shipment
          </DialogTitle>
          <DialogDescription>
            Assign a forwarder to a completed order. The shipment starts as
            Pending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {conflict && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">Duplicate active shipment</p>
                <p className="break-words">{conflict}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Order selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Completed order <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice number or customer"
                className="h-8 pl-8 text-xs"
                disabled={submitting}
              />
            </div>

            {txError && (
              <p className="text-xs text-destructive break-words">{txError}</p>
            )}

            <div className="max-h-44 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {txLoading ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Loading orders...
                </p>
              ) : transactions.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No completed orders found.
                </p>
              ) : (
                transactions.map((tx) => {
                  const blocked = hasActiveShipment(tx);
                  const selected = selectedTx?.id === tx.id;
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      disabled={blocked || submitting}
                      onClick={() => {
                        setSelectedTx(tx);
                        setConflict(null);
                        setError(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors",
                        selected
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-accent/40",
                        blocked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono font-semibold tabular-nums">
                          {tx.invoice_number ?? `Order #${tx.id}`}
                        </span>
                        <span
                          className="block truncate text-muted-foreground"
                          title={tx.customer?.name ?? ""}
                        >
                          {tx.customer?.name ?? "Walk-in Customer"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono tabular-nums">
                          {formatPeso(Number(tx.grand_total))}
                        </span>
                        {blocked && (
                          <span className="block text-[10px] font-semibold text-amber-700">
                            Active shipment exists
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Forwarder selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Forwarder <span className="text-destructive">*</span>
            </Label>
            <Select
              value={forwarderId || null}
              disabled={submitting || forwardersLoading || noForwarders}
              onValueChange={(value) => setForwarderId(value ?? "")}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Select forwarder">
                  {(value: string | null) =>
                    forwarders.find((f) => String(f.id) === value)
                      ?.company_name ??
                    (forwardersLoading ? "Loading..." : "Select forwarder")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {forwarders.map((forwarder) => (
                  <SelectItem key={forwarder.id} value={String(forwarder.id)}>
                    {forwarder.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {forwardersError && (
              <p className="text-xs text-destructive break-words">
                {forwardersError}
              </p>
            )}
            {noForwarders && (
              <p className="text-xs text-amber-700">
                No active forwarders available. Ask an admin or manager to add
                or reactivate one.
              </p>
            )}
          </div>

          {/* Optional fields */}
          <div className="space-y-1.5">
            <Label
              htmlFor="shipment-tracking"
              className="text-xs text-muted-foreground"
            >
              Tracking / waybill number (optional)
            </Label>
            <Input
              id="shipment-tracking"
              value={trackingNumber}
              maxLength={TRACKING_MAX}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. LBC-987654321-PH"
              className="h-8 font-mono text-xs tabular-nums"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="shipment-notes"
              className="text-xs text-muted-foreground"
            >
              Delivery notes (optional)
            </Label>
            <Textarea
              id="shipment-notes"
              value={notes}
              maxLength={NOTES_MAX}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Destination remarks or special instructions"
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedTx || !forwarderId}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Shipment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}