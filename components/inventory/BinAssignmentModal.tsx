// Bin assignment modal for the Inventory Management module of the POS system.
// Lets staff move an inventory item to a different digital storage bin.
// Sends PATCH /inventory/{id}/bin and reports success to the parent table.
"use client";

import * as React from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/inventory/types";
import { apiClient } from "@/lib/api";

interface BinAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  item: InventoryItem;
}

// Builds a readable label for the bin an item is currently in.
function getCurrentBinLabel(item: InventoryItem): string {
  if (!item.binId) {
    return "Not assigned";
  }

  const location =
    item.bin_aisle_number || item.bin_shelf_location
      ? ` (${item.bin_aisle_number ?? "-"} - ${item.bin_shelf_location ?? "-"})`
      : "";

  return `Bin #${item.binId}${location}`;
}

// Extracts a readable message from an API error, falling back to a default.
function getApiErrorMessage(error: unknown): string {
  const fallback = "Failed to assign the bin. Please try again.";

  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }

  const message = error.response.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return typeof message === "string" && message ? message : fallback;
}

export function BinAssignmentModal({
  isOpen,
  onClose,
  onSaved,
  item,
}: BinAssignmentModalProps) {
  const [binId, setBinId] = React.useState(item.binId?.toString() ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // Update the input when a different inventory item is selected
  React.useEffect(() => {
    setBinId(item.binId?.toString() ?? "");
    setError("");
  }, [item]);

  const trimmedBinId = binId.trim();
  const parsedBinId = Number(trimmedBinId);
  const isWholeNumber = /^\d+$/.test(trimmedBinId) && parsedBinId > 0;
  const newBinLabel = isWholeNumber ? `Bin #${parsedBinId}` : "-";

  // Checks the entered Bin ID and returns an error message, or null if valid.
  const getValidationError = (): string | null => {
    if (!trimmedBinId) {
      return "Please enter a Bin ID.";
    }

    if (!isWholeNumber) {
      return "Bin ID must be a positive whole number.";
    }

    if (parsedBinId === item.binId) {
      return "This item is already assigned to that bin.";
    }

    return null;
  };

  const validationError = getValidationError();
  const showValidationError = trimmedBinId !== "" && validationError !== null;

  // Updates the input and clears any previous API error.
  const handleBinIdChange = (value: string) => {
    setBinId(value);
    setError("");
  };

  // Validates the Bin ID, then sends the PATCH request to assign the bin.
  const handleSave = async () => {
    setError("");

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);

      await apiClient.patch(`/inventory/${item.id}/bin`, {
        binId: parsedBinId,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to assign bin:", err);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Bin Location for {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Current bin</dt>
            <dd className="font-medium">{getCurrentBinLabel(item)}</dd>

            <dt className="text-muted-foreground">New bin</dt>
            <dd className="font-medium">{newBinLabel}</dd>
          </dl>

          <div className="space-y-2">
            <label htmlFor="binId">New Bin ID</label>

            <Input
              id="binId"
              type="number"
              min="1"
              step="1"
              placeholder="Enter Bin ID"
              value={binId}
              onChange={(e) => handleBinIdChange(e.target.value)}
              disabled={isSaving}
              aria-invalid={showValidationError}
            />

            {showValidationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          {error && !showValidationError && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || validationError !== null}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
