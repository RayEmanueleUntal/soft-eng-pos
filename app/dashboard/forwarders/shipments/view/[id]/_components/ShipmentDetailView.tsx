"use client";

// Detail page body for a single shipment (GET /shipments/{id}).
// Renders the tracking record, inline edit form, status history, and
// update-status / cancel actions inside DetailShell.

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { DetailShell } from "@/components/shared/DetailShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { Button } from "@/components/ui/button";
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
import { ShipmentStatusBadge } from "../../../_components/ShipmentStatusBadge";
import { UpdateShipmentStatusModal } from "../../../_components/UpdateShipmentStatusModal";
import { useShipmentDetail } from "@/lib/inventory/useShipmentDetail";
import { canDeleteShipment, canUpdateShipment } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { Shipment } from "@/lib/inventory/shipment-types";
import { formatDateTime, getNextStatus, STATUS_LABELS } from "@/lib/inventory/shipment-utils";

const TRACKING_MAX = 100;
const NOTES_MAX = 500;

// One label/value row; long values wrap instead of overflowing.
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

interface ShipmentDetailViewProps {
  shipmentId: number | null;
}

export function ShipmentDetailView({ shipmentId }: ShipmentDetailViewProps) {
  const d = useShipmentDetail(shipmentId);
  const role = useCurrentRole();
  const { shipment } = d;

  const canUpdate = canUpdateShipment(role);
  const canDelete = canDeleteShipment(role);
  const nextStatus = shipment ? getNextStatus(shipment.tracking_status) : null;

  return (
    <DetailShell
      title={shipment ? `Shipment #${shipment.id}` : "Shipment"}
      backLabel="Back to Shipments"
      onBack={d.goBack}
      loading={d.loading}
      loadingMessage="Loading shipment..."
      error={
        d.loadError
          ? {
              title: "Shipment Not Found",
              message:
                d.loadError ||
                "The shipment could not be loaded. It may have been cancelled.",
              actionLabel: "Back to Shipments",
              onAction: d.goBack,
            }
          : null
      }
      maxWidth="2xl"
    >
      {shipment && (
        <div className="space-y-5">
          <div className="bg-card rounded-[4px] border border-input p-6 shadow-[0px_4px_0px_rgba(15,23,42,0.08)] space-y-5">
            <div className="flex items-center justify-between gap-2">
              <ShipmentStatusBadge status={shipment.tracking_status} />
              {!d.isActive && (
                <span className="text-xs text-muted-foreground">
                  Delivered shipments are read-only.
                </span>
              )}
            </div>

            {d.forwarderInactive && (
              <AlertBanner
                variant="warning"
                message={`${
                  shipment.forwarder?.company_name ?? "The assigned forwarder"
                } is no longer active. Reassign this shipment to an active forwarder before it is dispatched.`}
              />
            )}

            {d.actionNotice && (
              <AlertBanner
                variant="success"
                message={d.actionNotice}
                onDismiss={d.dismissActionNotice}
              />
            )}

            {d.actionError && (
              <AlertBanner message={d.actionError} />
            )}

            {d.editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  d.saveEdit();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Forwarder
                  </Label>
                  <Select
                    value={d.formForwarderId || null}
                    disabled={d.saving}
                    onValueChange={(value) =>
                      d.setFormForwarderId(value ?? "")
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Select forwarder">
                        {(value: string | null) =>
                          d.forwarders.find((f) => String(f.id) === value)
                            ?.company_name ??
                          (value && Number(value) === shipment.forwarderId
                            ? (shipment.forwarder?.company_name ??
                              "Current forwarder")
                            : "Select forwarder")
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {d.forwarders.map((forwarder) => (
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
                    value={d.formTracking}
                    maxLength={TRACKING_MAX}
                    onChange={(e) => d.setFormTracking(e.target.value)}
                    className="h-8 font-mono text-xs tabular-nums"
                    disabled={d.saving}
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
                    value={d.formNotes}
                    maxLength={NOTES_MAX}
                    onChange={(e) => d.setFormNotes(e.target.value)}
                    className="min-h-[72px] text-xs"
                    disabled={d.saving}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    The status history below is kept automatically.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={d.saving}
                    onClick={d.cancelEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={d.saving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {d.saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/40 p-3.5 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
                  <Field label="Delivery notes">
                    <span className="whitespace-pre-wrap">
                      {d.notesParts.base || "-"}
                    </span>
                  </Field>
                </div>
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
                {d.notesParts.entries.map((entry, index) => (
                  <li key={`${entry.timestamp}-${index}`} className="text-xs">
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </span>
                    <span className="ml-2 font-medium">{entry.action}</span>
                    {entry.note && (
                      <p className="break-words text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <p className="text-[10px] text-muted-foreground">
                Entries appear when status updates or detail edits are saved.
              </p>
            </div>

            {/* Actions */}
            {d.isActive && !d.editing && (canUpdate || canDelete) && (
              <div className="space-y-2 border-t border-border pt-4">
                {d.confirmDelete ? (
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
                        disabled={d.deleting}
                        onClick={() => d.setConfirmDelete(false)}
                      >
                        Keep
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={d.deleting}
                        onClick={d.deleteShipmentRecord}
                      >
                        {d.deleting && (
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
                        onClick={() => d.setStatusTarget(shipment)}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Update status to {STATUS_LABELS[nextStatus]}
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={d.startEditing}
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
                        onClick={() => d.setConfirmDelete(true)}
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
        </div>
      )}

      <UpdateShipmentStatusModal
        shipment={d.statusTarget}
        onClose={() => d.setStatusTarget(null)}
        onUpdated={d.handleStatusUpdated}
      />
    </DetailShell>
  );
}
