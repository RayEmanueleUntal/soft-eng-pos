// Stock adjustment modal for the Inventory Management module of the POS system.
// Lets authorised staff correct an item's stock to a newly counted quantity (POST /inventory/adjust).
// Works per inventory row (controlled) or standalone from the adjustments page with a product search.
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryItem } from "@/lib/inventory/types";
import {
  adjustInventory,
  StockMovementResponse,
} from "@/lib/inventory/stock-movement-api";
import { allowsDecimals, roundQty } from "@/lib/inventory/uom";
import { ProductPicker } from "./ProductPicker";

interface StockAdjustmentModalProps {
  item?: InventoryItem | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (movement: StockMovementResponse, item: InventoryItem) => void;
  trigger?: React.ReactElement;
}

interface AdjustmentFormProps {
  initialItem: InventoryItem | null;
  onCancel: () => void;
  onSaved: (movement: StockMovementResponse, item: InventoryItem) => void;
}

// Form body; it unmounts when the dialog closes, so its state resets on every open.
function AdjustmentForm({ initialItem, onCancel, onSaved }: AdjustmentFormProps) {
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(
    initialItem,
  );
  const [newCount, setNewCount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const decimals = selectedItem ? allowsDecimals(selectedItem.base_uom) : false;
  const parsedCount = newCount.trim() === "" ? NaN : Number(newCount);
  const difference =
    selectedItem && !Number.isNaN(parsedCount)
      ? roundQty(parsedCount - selectedItem.current_quantity)
      : null;

  // Returns an error message for the current inputs, or null if they are valid.
  const getValidationError = (): string | null => {
    if (!selectedItem) {
      return "Select a product to adjust.";
    }

    if (Number.isNaN(parsedCount) || parsedCount <= 0) {
      return "Enter a counted quantity above 0. To remove all stock, use Stock Out.";
    }

    if (!decimals && !Number.isInteger(parsedCount)) {
      return `${selectedItem.base_uom} must be a whole number.`;
    }

    if (difference === 0) {
      return "The counted quantity matches the current stock.";
    }

    if (!reason.trim()) {
      return "Enter a reason for the adjustment.";
    }

    return null;
  };

  const validationError = getValidationError();

  // Sends the adjustment to the API and reports the created movement to the parent.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (validationError || !selectedItem) {
      setError(validationError ?? "Select a product to adjust.");
      return;
    }

    try {
      setIsSubmitting(true);

      const movement = await adjustInventory({
        productId: selectedItem.id,
        current_uom: selectedItem.base_uom,
        new_count: parsedCount,
        reason: reason.trim(),
      });

      onSaved(movement, selectedItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {!selectedItem ? (
        <div className="space-y-2">
          <Label>Product</Label>
          <ProductPicker onSelect={setSelectedItem} />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product</Label>
              {!initialItem && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  disabled={isSubmitting}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Change
                </button>
              )}
            </div>
            <div className="space-y-1 rounded-[4px] bg-muted/50 p-2.5 text-sm">
              <p className="font-medium">{selectedItem.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {selectedItem.sku ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Current stock: </span>
                <span className="font-mono font-medium">
                  {selectedItem.current_quantity} {selectedItem.base_uom}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newCount">
              New counted quantity ({selectedItem.base_uom})
            </Label>
            <Input
              id="newCount"
              type="number"
              min={decimals ? "0" : "1"}
              step={decimals ? "any" : "1"}
              placeholder="0"
              value={newCount}
              onChange={(event) => {
                setNewCount(event.target.value);
                setError("");
              }}
              disabled={isSubmitting}
              className="rounded-[2px] font-mono"
              required
            />

            {!Number.isNaN(parsedCount) && parsedCount <= 0 && (
              <p className="text-xs text-destructive">
                Enter a quantity above 0. To remove all stock, use Stock Out.
              </p>
            )}

            {difference === 0 && (
              <p className="text-xs text-muted-foreground">
                Matches the current stock, so there is nothing to adjust.
              </p>
            )}

            {difference !== null && difference !== 0 && (
              <p
                className={`font-mono text-xs ${
                  difference > 0 ? "text-primary" : "text-destructive"
                }`}
              >
                Change: {difference > 0 ? "+" : ""}
                {difference} {selectedItem.base_uom}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g. Damaged, recount discrepancy"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              disabled={isSubmitting}
              className="rounded-[2px]"
              required
            />
          </div>
        </>
      )}

      {error && (
        <div className="rounded-[4px] border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DialogFooter className="mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || validationError !== null}
          className="rounded-[4px]"
        >
          {isSubmitting ? "Saving..." : "Adjust Stock"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Renders the adjustment dialog; controlled via open/onOpenChange, or self-managed with a trigger.
export function StockAdjustmentModal({
  item = null,
  open,
  onOpenChange,
  onSuccess,
  trigger,
}: StockAdjustmentModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  // Updates whichever open state is in use and notifies the parent.
  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const handleSaved = (movement: StockMovementResponse, saved: InventoryItem) => {
    onSuccess?.(movement, saved);
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button className="h-9 rounded-[4px] bg-primary px-4 py-2 font-heading font-semibold text-primary-foreground shadow hover:bg-primary/90">
                Adjust Stock
              </Button>
            )
          }
        />
      )}
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-foreground">
            {item ? `Adjust Stock: ${item.name}` : "Adjust Stock"}
          </DialogTitle>
        </DialogHeader>
        <AdjustmentForm
          initialItem={item}
          onCancel={() => setOpen(false)}
          onSaved={handleSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
