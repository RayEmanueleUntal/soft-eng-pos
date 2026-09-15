"use client";

import * as React from "react";
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

  const handleSave = async () => {
    setError("");

    const parsedBinId = Number(binId);

    if (!binId || !Number.isInteger(parsedBinId) || parsedBinId <= 0) {
      setError("Please enter a valid Bin ID.");
      return;
    }

    try {
      setIsSaving(true);

      await apiClient.patch(`/inventory/${item.id}/bin`, {
        binId: parsedBinId,
      });

      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Failed to assign bin:", error);

      setError(
        error?.response?.data?.message ||
          "Failed to assign the bin. Please try again.",
      );
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
          <div className="space-y-2">
            <label htmlFor="binId">Bin ID</label>

            <Input
              id="binId"
              type="number"
              min="1"
              placeholder="Enter Bin ID"
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              disabled={isSaving}
            />

            {item.binId && (
              <p className="text-sm text-muted-foreground">
                Current Bin ID: {item.binId}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
