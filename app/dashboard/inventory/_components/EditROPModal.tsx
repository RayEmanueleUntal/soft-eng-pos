// Modal for editing a product's reorder point (ROP) in the POS inventory module.
// Saves the new value through PATCH /products/{id} so stock status updates everywhere.
// Mount it only while an item is being edited so the input starts from that item's ROP.
"use client";

import { useState } from "react";
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
import { updateReorderPoint } from "@/lib/inventory/stock-rop-api";

interface EditROPModalProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// Renders the edit form, validates the number and persists it through the API.
export function EditROPModal({ item, open, onOpenChange, onSaved }: EditROPModalProps) {
  const [ropValue, setRopValue] = useState<string>(item?.reorder_point_ROP.toString() || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validates the input, saves it and reports success to the parent.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const newROP = Number(ropValue);

    if (!Number.isInteger(newROP) || newROP < 0) {
      setError("Enter a whole number that is 0 or higher.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateReorderPoint(item.id, newROP);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the reorder point.");
    } finally {
      setSaving(false);
    }
  };

  // Closes the modal without saving.
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={item?.id || "none"}>
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Edit Reorder Point</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Product Information</p>
            <div className="bg-muted/50 p-2.5 rounded-lg space-y-1">
              <p className="text-sm"><span className="font-medium">Name:</span> {item.name}</p>
              <p className="text-sm"><span className="font-medium">Current Quantity:</span> <span className="font-mono">{item.current_quantity}</span></p>
              <p className="text-sm"><span className="font-medium">Current ROP:</span> <span className="font-mono">{item.reorder_point_ROP}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rop" className="text-sm font-medium">
              New Reorder Point
            </label>
            <Input
              id="rop"
              type="number"
              min="0"
              step="1"
              placeholder="Enter new reorder point"
              value={ropValue}
              onChange={(e) => setRopValue(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Items with quantity at or below this value will be marked as LOW STOCK
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-[4px] border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
