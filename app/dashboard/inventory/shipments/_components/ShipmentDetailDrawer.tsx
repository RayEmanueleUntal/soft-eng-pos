// Right-side drawer with the full tracking record of one shipment (GET /shipments/{id}).
// Shows order, forwarder, waybill, timestamps, notes and the status history, and lets permitted roles
// edit details (PATCH /shipments/{id}), start a status update, or cancel an active shipment (DELETE).
// Built on the Dialog primitive because the project has no Sheet component.
"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import {
  deleteShipment,
  fetchActiveForwarders,
  fetchShipmentById,
  updateShipment,
} from "@/lib/inventory/shipment-api";
import {
  Forwarder,
  Shipment,
  UpdateShipmentPayload,
} from "@/lib/inventory/shipment-types";
import {
  formatDateTime,
  getNextStatus,
  splitShipmentNotes,
} from "@/lib/inventory/shipment-utils";
import { getErrorMessage } from "@/lib/utils";

const TRACKING_MAX = 100;
const NOTES_MAX = 500;

interface ShipmentDetailDrawerProps {
  shipmentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
  canDelete: boolean;
  onUpdateStatus: (shipment: Shipment) => void;
  onChanged: () => void;
}

// One label/value row; long values wrap instead of overflowing the drawer.
function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`break-words text-sm text-foreground ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}

export function ShipmentDetailDrawer({
  shipmentId,
  open,
  onOpenChange,
  canUpdate,
  canDelete,
  onUpdateStatus,
  onChanged,
}: ShipmentDetailDrawerProps) {
  const [shipment, setShipment] = React.useState<Shipment | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [forwarders, setForwarders] = React.useState<Forwarder[]>([]);
  const [forwardersLoaded, setForwardersLoaded] = React.useState(false);

  const [editing, setEditing] = React.useState(false);
  const [formForwarderId, setFormForwarderId] = React.useState("");
  const [formTracking, setFormTracking] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Loads the shipment (and active forwarders for editing/warnings) whenever the drawer opens.
  React.useEffect(() => {
    if (!open || shipmentId === null) return;

    let cancelled = false;
    setShipment(null);
    setLoading(true);
    setLoadError(null);
    setEditing(false);
    setConfirmDelete(false);
    setActionError(null);
    setForwardersLoaded(false);

    fetchShipmentById(shipmentId)
      .then((res) => {
        if (!cancelled) setShipment(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(err, "Failed to load shipment details."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (canUpdate) {
      fetchActiveForwarders()
        .then((res) => {
          if (!cancelled) {
            setForwarders(res.data ?? []);
            setForwardersLoaded(true);
          }
        })
        .catch(() => {
          // Forwarder list is only used for editing and the inactive warning; leave both disabled.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [open, shipmentId, canUpdate]);

  const notesParts = splitShipmentNotes(shipment?.notes);
  const isActive = shipment ? shipment.tracking_status !== "DELIVERED" : false;
  const nextStatus = shipment ? getNextStatus(shipment.tracking_status) : null;

  // The assigned forwarder is missing from the active list, so it was deactivated after assignment.
  const forwarderInactive =
    forwardersLoaded &&
    isActive &&
    shipment !== null &&
    !forwarders.some((f) => f.id === shipment.forwarderId);

  const startEditing = () => {
    if (!shipment) return;
    setFormForwarderId(String(shipment.forwarderId));
    setFormTracking(shipment.tracking_number ?? "");
    setFormNotes(notesParts.base);
    setActionError(null);
    setEditing(true);
  };

  // Sends only the fields that changed. Status log lines are re-attached so editing notes does not erase them.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;

    const payload: UpdateShipmentPayload = {};
    if (formForwarderId && Number(formForwarderId) !== shipment.forwarderId) {
      payload.forwarderId = Number(formForwarderId);
    }
    if (formTracking.trim() !== (shipment.tracking_number ?? "")) {
      if (formTracking.trim().length > TRACKING_MAX) {
        setActionError(
          `Tracking number must be ${TRACKING_MAX} characters or fewer.`,
        );
        return;
      }
      payload.tracking_number = formTracking.trim();
    }
    if (formNotes.trim() !== notesParts.base) {
      const combined = [formNotes.trim(), ...notesParts.rawLogLines]
        .filter(Boolean)
        .join("\n");
      if (combined.length > NOTES_MAX) {
        setActionError(
          `Notes (including the status history) must be ${NOTES_MAX} characters or fewer.`,
        );
        return;
      }
      payload.notes = combined;
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateShipment(shipment.id, payload);
      setShipment(updated);
      setEditing(false);
      onChanged();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to update the shipment."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shipment) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteShipment(shipment.id);
      onOpenChange(false);
      onChanged();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to cancel the shipment."));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        className="fixed inset-y-0 top-0 right-0 left-auto h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none border-l border-border p-5 sm:max-w-md data-open:slide-in-from-right-8 data-closed:slide-out-to-right-8"
      >
        <DialogHeader className="border-b border-border pb-3 pr-8">
          <DialogTitle className="font-heading text-base font-bold tracking-tight">
            Shipment #{shipmentId}
          </DialogTitle>
          <DialogDescription>Tracking record and delivery log.</DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading shipment...
          </p>
        )}

        {loadError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{loadError}</span>
          </div>
        )}

        {shipment && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <ShipmentStatusBadge status={shipment.tracking_status} />
              {!isActive && (
                <span className="text-xs text-muted-foreground">
                  Delivered shipments are read-only.
                </span>
              )}
            </div>

            {forwarderInactive && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">
                  {shipment.forwarder?.company_name ?? "The assigned forwarder"}{" "}
                  is no longer active. Reassign this shipment to an active
                  forwarder before it is dispatched.
                </span>
              </div>
            )}

            {actionError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{actionError}</span>
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Forwarder
                  </Label>
                  <Select
                    value={formForwarderId || null}
                    disabled={saving}
                    onValueChange={(value) => setFormForwarderId(value ?? "")}
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Select forwarder">
                        {(value: string | null) =>
                          forwarders.find((f) => String(f.id) === value)
                            ?.company_name ??
                          (value && Number(value) === shipment.forwarderId
                            ? (shipment.forwarder?.company_name ??
                              "Current forwarder")
                            : "Select forwarder")
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {forwarders.map((forwarder) => (
                        <SelectItem
                          key={forwarder.id}
                          value={String(forwarder.id)}
                        >
                          {forwarder.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-tracking"
                    className="text-xs text-muted-foreground"
                  >
                    Tracking / waybill number
                  </Label>
                  <Input
                    id="edit-tracking"
                    value={formTracking}
                    maxLength={TRACKING_MAX}
                    onChange={(e) => setFormTracking(e.target.value)}
                    className="h-8 font-mono text-xs tabular-nums"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-notes"
                    className="text-xs text-muted-foreground"
                  >
                    Delivery notes
                  </Label>
                  <Textarea
                    id="edit-notes"
                    value={formNotes}
                    maxLength={NOTES_MAX}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="min-h-[72px] text-xs"
                    disabled={saving}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    The status history below is kept automatically.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setActionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="space-y-4">
                <Field label="Invoice" mono>
                  {shipment.transaction?.invoice_number ??
                    `Order #${shipment.transactionId}`}
                </Field>
                <Field label="Customer">
                  {shipment.transaction?.customer_name || "-"}
                </Field>
                <Field label="Forwarder">
                  {shipment.forwarder?.company_name ?? "-"}
                </Field>
                <Field label="Forwarder contact" mono>
                  {shipment.forwarder?.tracking_contact_info ?? "-"}
                </Field>
                <Field label="Tracking / waybill number" mono>
                  {shipment.tracking_number || "-"}
                </Field>
                <Field label="Dispatch date">
                  {formatDateTime(shipment.dispatch_date)}
                </Field>
                <Field label="Last updated">
                  {formatDateTime(shipment.updatedAt)}
                </Field>
                <Field label="Delivery notes">
                  <span className="whitespace-pre-wrap">
                    {notesParts.base || "-"}
                  </span>
                </Field>
              </dl>
            )}

            {/* Status history parsed from the notes log */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status history
              </h3>
              <ol className="space-y-2 border-l border-border pl-3">
                <li className="text-xs">
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatDateTime(shipment.createdAt)}
                  </span>
                  <span className="ml-2 font-medium">Shipment logged</span>
                </li>
                {notesParts.entries.map((entry, index) => (
                  <li key={`${entry.timestamp}-${index}`} className="text-xs">
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </span>
                    <span className="ml-2 font-medium">
                      {entry.status.charAt(0) +
                        entry.status.slice(1).toLowerCase()}
                    </span>
                    {entry.note && (
                      <p className="break-words text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <p className="text-[10px] text-muted-foreground">
                Entries appear when a status note is added during an update.
              </p>
            </div>

            {/* Actions */}
            {isActive && !editing && (canUpdate || canDelete) && (
              <div className="space-y-2 border-t border-border pt-4">
                {confirmDelete ? (
                  <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs text-destructive">
                      Cancel and remove this shipment record? This cannot be
                      undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deleting}
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleting}
                        onClick={handleDelete}
                      >
                        {deleting && (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        )}
                        Cancel Shipment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {canUpdate && nextStatus && (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => onUpdateStatus(shipment)}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Update status
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={startEditing}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit details
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancel shipment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}