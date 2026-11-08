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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/lib/inventory/types";
import { apiClient } from "@/lib/api";
import {
  adjustInventory,
  StockMovementResponse,
} from "@/lib/inventory/stock-movement-api";
import { allowsDecimals, roundQty } from "@/lib/inventory/uom";
import { ProductPicker } from "./ProductPicker";
import { Plus } from "lucide-react";

interface UomOption {
  uom: string;
  conversionFactor: number;
}

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
function AdjustmentForm({
  initialItem,
  onCancel,
  onSaved,
}: AdjustmentFormProps) {
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(
    initialItem,
  );
  const [newCount, setNewCount] = React.useState("");
  const [selectedUom, setSelectedUom] = React.useState("");
  const [availableUoms, setAvailableUoms] = React.useState<UomOption[]>([]);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch product alternate UoMs whenever selectedItem changes
  React.useEffect(() => {
    if (!selectedItem) {
      setAvailableUoms([]);
      setSelectedUom("");
      return;
    }

    const baseUom = selectedItem.base_uom || "PCS";
    setSelectedUom(baseUom);

    const fallbackUoms: UomOption[] = [{ uom: baseUom, conversionFactor: 1 }];
    if (
      selectedItem.pricing_uom &&
      selectedItem.pricing_uom.toUpperCase() !== baseUom.toUpperCase()
    ) {
      fallbackUoms.push({
        uom: selectedItem.pricing_uom,
        conversionFactor:
          selectedItem.pricing_unit_qty && selectedItem.pricing_unit_qty > 0
            ? selectedItem.pricing_unit_qty
            : 1,
      });
    }

    let isMounted = true;

    apiClient
      .get<{ data: any } | any>(`/products/${selectedItem.id}`)
      .then((res) => {
        if (!isMounted) return;
        const prod = res.data?.data || res.data || {};
        const list: UomOption[] = [
          { uom: prod.base_uom || baseUom, conversionFactor: 1 },
        ];

        if (Array.isArray(prod.uoms)) {
          prod.uoms.forEach((u: any) => {
            const factor =
              Number(
                u.conversion_factor ?? u.conversionFactor ?? u.multiplier ?? 1,
              ) || 1;
            if (
              u.uom &&
              !list.some((o) => o.uom.toUpperCase() === u.uom.toUpperCase())
            ) {
              list.push({ uom: u.uom, conversionFactor: factor });
            }
          });
        }

        if (
          prod.pricing_uom &&
          !list.some(
            (o) => o.uom.toUpperCase() === prod.pricing_uom.toUpperCase(),
          )
        ) {
          list.push({
            uom: prod.pricing_uom,
            conversionFactor: Number(prod.pricing_unit_qty ?? 1) || 1,
          });
        }

        setAvailableUoms(list);
      })
      .catch((err) => {
        console.error("Failed to fetch product UoMs for adjustment:", err);
        if (isMounted) {
          setAvailableUoms(fallbackUoms);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedItem]);

  const activeUomOption = React.useMemo(() => {
    return (
      availableUoms.find(
        (u) => u.uom.toUpperCase() === selectedUom.toUpperCase(),
      ) || {
        uom: selectedUom || selectedItem?.base_uom || "PCS",
        conversionFactor: 1,
      }
    );
  }, [availableUoms, selectedUom, selectedItem]);

  const conversionFactor = activeUomOption.conversionFactor;
  const decimals = selectedItem
    ? allowsDecimals(selectedUom || selectedItem.base_uom)
    : false;
  const parsedCount = newCount.trim() === "" ? NaN : Number(newCount);

  // Converted base counted quantity
  const baseCountedQuantity = Number.isNaN(parsedCount)
    ? NaN
    : roundQty(parsedCount * conversionFactor);

  const difference =
    selectedItem && !Number.isNaN(baseCountedQuantity)
      ? roundQty(baseCountedQuantity - selectedItem.current_quantity)
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
      return `${selectedUom || selectedItem.base_uom} must be a whole number.`;
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
        current_uom: selectedUom || selectedItem.base_uom,
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
    <form onSubmit={handleSubmit} className="grid gap-3.5 py-2">
      {!selectedItem ? (
        <div className="space-y-2">
          <Label className="text-xs">Product Search</Label>
          <ProductPicker onSelect={setSelectedItem} />
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Product Details</Label>
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
            <div className="space-y-1 rounded-[4px] bg-muted/50 p-2.5 text-xs border border-border">
              <p className="font-medium">{selectedItem.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                SKU: {selectedItem.sku ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Current Stock: </span>
                <span className="font-mono font-bold text-foreground">
                  {selectedItem.current_quantity} {selectedItem.base_uom}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="newCount" className="text-xs">
                New Counted Qty
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
                className="rounded-[2px] font-mono text-sm h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjust-uom" className="text-xs">
                Unit of Measure (UoM)
              </Label>
              {availableUoms.length > 1 ? (
                <Select
                  value={selectedUom}
                  onValueChange={(val) => setSelectedUom(val ?? "")}
                >
                  <SelectTrigger
                    id="adjust-uom"
                    className="h-9 font-mono text-xs rounded-[2px]"
                  >
                    <SelectValue placeholder="Select UoM" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUoms.map((opt) => (
                      <SelectItem
                        key={opt.uom}
                        value={opt.uom}
                        className="font-mono text-xs"
                      >
                        {opt.uom}{" "}
                        {opt.conversionFactor !== 1
                          ? `(×${opt.conversionFactor})`
                          : "(Base)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="adjust-uom"
                  value={selectedUom || selectedItem.base_uom}
                  disabled
                  className="font-mono text-xs h-9 rounded-[2px] bg-muted"
                />
              )}
            </div>
          </div>

          {/* Live Conversion Calculation Preview */}
          {!Number.isNaN(parsedCount) && (
            <div className="bg-muted/40 p-2.5 rounded-[4px] border border-border space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Base Unit Equivalent:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {baseCountedQuantity} {selectedItem.base_uom}
                  {conversionFactor !== 1 && (
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      (1 {selectedUom} = {conversionFactor}{" "}
                      {selectedItem.base_uom})
                    </span>
                  )}
                </span>
              </div>
              {difference !== null && (
                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">
                    Net Stock Delta:
                  </span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      difference > 0
                        ? "text-primary"
                        : difference < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {difference > 0 ? "+" : ""}
                    {difference} {selectedItem.base_uom}
                  </span>
                </div>
              )}
            </div>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs">
              Reason
            </Label>
            <Input
              id="reason"
              placeholder="e.g. Damaged, recount discrepancy, audit"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              disabled={isSubmitting}
              className="rounded-[2px] text-xs h-9"
              required
            />
          </div>
        </>
      )}

      {error && (
        <div className="rounded-[4px] border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      <DialogFooter className="mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-[2px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || validationError !== null}
          className="rounded-[2px]"
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

  const handleSaved = (
    movement: StockMovementResponse,
    saved: InventoryItem,
  ) => {
    onSuccess?.(movement, saved);
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                <span>Adjust Stock</span>
              </Button>
            )
          }
        />
      )}
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0 sm:max-w-[440px]">
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
