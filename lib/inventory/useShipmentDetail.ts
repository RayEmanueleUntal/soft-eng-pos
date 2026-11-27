"use client";

// State and data flow for the shipment detail page (/forwarders/shipments/view/[id]).
// Loads GET /shipments/{id} plus active forwarders for editing, owns the inline
// edit form, delete confirmation, and the status-update modal state.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteShipment,
  fetchActiveForwarders,
  fetchShipmentById,
  updateShipment,
} from "./shipment-api";
import {
  Forwarder,
  Shipment,
  UpdateShipmentPayload,
} from "./shipment-types";
import {
  formatEditLogLine,
  splitShipmentNotes,
} from "./shipment-utils";
import { getErrorMessage } from "@/lib/utils";

const TRACKING_MAX = 100;
const NOTES_MAX = 500;

export function useShipmentDetail(shipmentId: number | null) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shipment, setShipment] = React.useState<Shipment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [forwarders, setForwarders] = React.useState<Forwarder[]>([]);
  const [forwardersLoaded, setForwardersLoaded] = React.useState(false);

  const [editing, setEditing] = React.useState(false);
  const [formForwarderId, setFormForwarderId] = React.useState("");
  const [formTracking, setFormTracking] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [statusTarget, setStatusTarget] = React.useState<Shipment | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const notesParts = splitShipmentNotes(shipment?.notes);

  // Loads the shipment (and active forwarders for editing/warnings) on mount and after changes.
  React.useEffect(() => {
    if (shipmentId === null) {
      setShipment(null);
      setLoading(false);
      setLoadError("Invalid shipment link.");
      return;
    }

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
          setLoadError(
            getErrorMessage(err, "Failed to load shipment details."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

    return () => {
      cancelled = true;
    };
  }, [shipmentId, reloadKey]);

  const isActive = shipment ? shipment.tracking_status !== "DELIVERED" : false;

  // The assigned forwarder is missing from the active list, so it was deactivated after assignment.
  const forwarderInactive =
    forwardersLoaded &&
    isActive &&
    shipment !== null &&
    !forwarders.some((f) => f.id === shipment.forwarderId);

  const reload = () => setReloadKey((key) => key + 1);

  // Returns to the filtered list when the detail page was opened from it;
  // the `back` param is validated to stay inside the shipments list route.
  const goBack = () => {
    const back = searchParams.get("back");
    const isListUrl =
      back === "/dashboard/forwarders/shipments" ||
      back?.startsWith("/dashboard/forwarders/shipments?");
    router.push(isListUrl ? back! : "/dashboard/forwarders/shipments");
  };

  const startEditing = () => {
    if (!shipment) return;
    setFormForwarderId(String(shipment.forwarderId));
    setFormTracking(shipment.tracking_number ?? "");
    setFormNotes(notesParts.base);
    setActionError(null);
    setActionNotice(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setActionError(null);
  };

  // Sends only the fields that changed. Status log lines are re-attached so editing notes does not erase them.
  const saveEdit = async () => {
    if (!shipment) return;

    const payload: UpdateShipmentPayload = {};
    const changes: string[] = [];

    if (formForwarderId && Number(formForwarderId) !== shipment.forwarderId) {
      payload.forwarderId = Number(formForwarderId);
      const nextName =
        forwarders.find((f) => String(f.id) === formForwarderId)
          ?.company_name ?? `#${formForwarderId}`;
      changes.push(`Forwarder -> ${nextName}`);
    }

    if (formTracking.trim() !== (shipment.tracking_number ?? "")) {
      if (formTracking.trim().length > TRACKING_MAX) {
        setActionError(
          `Tracking number must be ${TRACKING_MAX} characters or fewer.`,
        );
        return;
      }
      payload.tracking_number = formTracking.trim();
      changes.push(
        formTracking.trim()
          ? `Tracking -> ${formTracking.trim()}`
          : "Tracking cleared",
      );
    }

    if (formNotes.trim() !== notesParts.base) {
      changes.push("Delivery notes updated");
    }

    if (changes.length === 0) {
      setEditing(false);
      return;
    }

    // Append an audit entry for this edit while preserving existing log lines
    const nextLogLines = [
      ...notesParts.rawLogLines,
      formatEditLogLine(changes.join("; ")),
    ];
    const combined = [formNotes.trim(), ...nextLogLines]
      .filter(Boolean)
      .join("\n");

    if (combined.length > NOTES_MAX) {
      setActionError(
        `Notes (including the status history) must be ${NOTES_MAX} characters or fewer.`,
      );
      return;
    }
    payload.notes = combined;

    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateShipment(shipment.id, payload);
      setShipment(updated);
      setEditing(false);
      setActionNotice("Shipment details updated.");
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to update the shipment."));
    } finally {
      setSaving(false);
    }
  };

  const deleteShipmentRecord = async () => {
    if (!shipment) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteShipment(shipment.id);
      goBack();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to cancel the shipment."));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdated = (updated: Shipment) => {
    setStatusTarget(null);
    setActionNotice(`Shipment is now ${updated.tracking_status}.`);
    reload();
  };

  const busy = saving || deleting;

  return {
    shipment,
    loading,
    loadError,
    forwarders,
    forwardersLoaded,
    notesParts,
    isActive,
    forwarderInactive,
    editing,
    formForwarderId,
    setFormForwarderId,
    formTracking,
    setFormTracking,
    formNotes,
    setFormNotes,
    saving,
    deleting,
    confirmDelete,
    setConfirmDelete,
    actionError,
    actionNotice,
    dismissActionNotice: () => setActionNotice(null),
    statusTarget,
    setStatusTarget,
    busy,
    reload,
    goBack,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteShipmentRecord,
    handleStatusUpdated,
  };
}
