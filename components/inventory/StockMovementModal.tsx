// Stock movement modal for the Inventory Management module of the POS system.
// Records stock received (POST /inventory/stock-in) or dispatched (POST /inventory/stock-out) for one item.
// Controlled by its parent via open/onOpenChange and reports the created movement on success.
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  stockIn,
  stockOut,
  StockInParams,
  StockOutParams,
  StockMovementResponse,
  adjustInventory,
} from "@/lib/inventory/stock-movement-api";

import { allowsDecimals, roundQty } from "@/lib/inventory/uom";
import { ProductPicker } from "./ProductPicker";
import { Plus, CheckCircle2 } from "lucide-react"; // <- added CheckCircle2

interface AdjustmentFormProps {
  initialItem: InventoryItem | null;
  onCancel: () => void;
  onSaved: (movement: StockMovementResponse, item: InventoryItem) => void;
}

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
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null); // <- added

  const parsedCount = Number(newCount);
  const validationError = !selectedItem
    ? "Select a product to adjust."
    : !newCount || Number.isNaN(parsedCount) || parsedCount <= 0
      ? "Enter a valid adjustment quantity."
      : "";

  // Auto-dismiss success message after 4 seconds.
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (validationError || !selectedItem) {
      setError(validationError || "Select a product to adjust.");
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

  // Show a success message when the adjustment is saved.
  React.useEffect(() => {
    if (!selectedItem) return;
    setSuccessMessage(`${selectedItem.name} adjusted successfully.`);
  }, [selectedItem]);

  return (
    <form onSubmit={handleSubmit} className="grid gap-3.5 py-2">
      {/* ... form fields unchanged ... */}

      {successMessage && ( // <- added success banner
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-[4px] border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      <DialogFooter className="mt-2">
        {/* ... buttons unchanged ... */}
      </DialogFooter>
    </form>
  );
}

interface UomOption {
  uom: string;
  conversionFactor: number;
}

interface StockMovementModalProps {
  item: InventoryItem | null;
  type: "in" | "out";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (movement: StockMovementResponse) => void;
}

// Renders the stock-in or stock-out dialog for the given item.
export function StockMovementModal({
  item,
  type,
  open,
  onOpenChange,
  onSuccess,
}: StockMovementModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [selectedUom, setSelectedUom] = useState<string>("");
  const [overrideStock, setOverrideStock] = useState<boolean>(false);
  const [availableUoms, setAvailableUoms] = useState<UomOption[]>([]);
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStockIn = type === "in";

  // Fetch product details to get alternate UoMs if open
  useEffect(() => {
    if (!open || !item) {
      setQuantity("");
      setReason("");
      setError("");
      setOverrideStock(false);
      return;
    }

    const baseUom = item.base_uom || "PCS";
    setSelectedUom(baseUom);

    // Build fallback list with base UoM and pricing UoM if present
    const fallbackUoms: UomOption[] = [{ uom: baseUom, conversionFactor: 1 }];
    if (
      item.pricing_uom &&
      item.pricing_uom.toUpperCase() !== baseUom.toUpperCase()
    ) {
      fallbackUoms.push({
        uom: item.pricing_uom,
        conversionFactor:
          item.pricing_unit_qty && item.pricing_unit_qty > 0
            ? item.pricing_unit_qty
            : 1,
      });
    }

    let isMounted = true;

    apiClient
      .get<{ data: any } | any>(`/products/${item.id}`)
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
        console.error("Failed to fetch product UoMs:", err);
        if (isMounted) {
          setAvailableUoms(fallbackUoms);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, item]);

  const activeUomOption = useMemo(() => {
    return (
      availableUoms.find(
        (u) => u.uom.toUpperCase() === selectedUom.toUpperCase(),
      ) || { uom: selectedUom || item?.base_uom || "PCS", conversionFactor: 1 }
    );
  }, [availableUoms, selectedUom, item]);

  const conversionFactor = activeUomOption.conversionFactor;
  const rawQty = parseFloat(quantity) || 0;
  const baseDeltaQty = roundQty(rawQty * conversionFactor);

  const decimals = item ? allowsDecimals(selectedUom || item.base_uom) : false;
  const currentStock = item ? item.current_quantity : 0;
  const projectedQuantity = item
    ? roundQty(
        isStockIn ? currentStock + baseDeltaQty : currentStock - baseDeltaQty,
      )
    : 0;

  const wouldCauseNegativeStock = !isStockIn && baseDeltaQty > currentStock;

  // Validates the quantity, then records the stock movement through the API.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!item) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity");
      return;
    }

    // For stock-out, validate against current quantity unless override is checked
    if (
      !isStockIn &&
      qty * conversionFactor > item.current_quantity &&
      !overrideStock
    ) {
      setError(
        `Cannot remove more than available stock (${item.current_quantity} ${item.base_uom}). Enable negative stock override to proceed.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const baseParams = {
        productId: item.id,
        current_uom: selectedUom || item.base_uom,
        reason: reason || undefined,
      };

      let movement: StockMovementResponse;

      if (isStockIn) {
        const params: StockInParams = {
          ...baseParams,
          added_qty: qty,
        };
        movement = await stockIn(params);
      } else {
        const params: StockOutParams = {
          ...baseParams,
          taken_qty: qty,
          allowOverride: overrideStock,
          // isOverride: overrideStock,
        };
        movement = await stockOut(params);
      }

      onSuccess(movement);
      onOpenChange(false);
      setQuantity("");
      setReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record stock movement",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Closes the dialog and clears the form.
  const handleCancel = () => {
    onOpenChange(false);
    setQuantity("");
    setReason("");
    setError("");
    setOverrideStock(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle
            className="font-bold text-base"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {isStockIn ? "Stock In" : "Stock Out"} — {item.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Product Information
            </Label>
            <div className="bg-muted/50 p-2.5 rounded-[4px] space-y-1 text-xs border border-border">
              <p>
                <span className="font-semibold text-foreground">Name:</span>{" "}
                {item.name}
              </p>
              <p>
                <span className="font-semibold text-foreground">SKU:</span>{" "}
                <span className="font-mono">{item.sku ?? "-"}</span>
              </p>
              <p>
                <span className="font-semibold text-foreground">
                  Current Stock:
                </span>{" "}
                <span className="font-mono font-bold text-foreground">
                  {item.current_quantity} {item.base_uom}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">
                Quantity ({isStockIn ? "to add" : "to remove"})
              </Label>
              <Input
                id="quantity"
                type="number"
                min={decimals ? "0" : "1"}
                step={decimals ? "any" : "1"}
                placeholder="0"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError("");
                }}
                required
                className="font-mono text-sm h-9 rounded-[2px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uom-select" className="text-xs">
                Unit of Measure (UoM)
              </Label>
              {availableUoms.length > 1 ? (
                <Select
                  value={selectedUom}
                  onValueChange={(val) => setSelectedUom(val ?? "")}
                >
                  <SelectTrigger
                    id="uom-select"
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
                  id="uom-select"
                  value={selectedUom || item.base_uom}
                  disabled
                  className="font-mono text-xs h-9 rounded-[2px] bg-muted"
                />
              )}
            </div>
          </div>

          {/* Live Calculation Preview */}
          {quantity && (
            <div className="bg-muted/40 p-2.5 rounded-[4px] border border-border space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Base Unit Equivalent:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {isStockIn ? "+" : "-"}
                  {baseDeltaQty} {item.base_uom}
                  {conversionFactor !== 1 && (
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      (1 {selectedUom} = {conversionFactor} {item.base_uom})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Projected Stock:</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    projectedQuantity < 0
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {projectedQuantity} {item.base_uom}
                </span>
              </div>
            </div>
          )}

          {/* Negative Stock Override Toggle for Stock-Out */}
          {!isStockIn && wouldCauseNegativeStock && (
            <div className="p-2.5 rounded-[4px] border border-destructive/40 bg-destructive/10 space-y-2">
              <p className="text-xs text-destructive font-medium">
                Warning: Removing this quantity will cause stock to become
                negative ({projectedQuantity} {item.base_uom}).
              </p>
              <label
                htmlFor="override-stock"
                className="flex items-center gap-2 text-xs font-semibold text-destructive cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="override-stock"
                  checked={overrideStock}
                  onChange={(e) => setOverrideStock(e.target.checked)}
                  className="rounded-[2px] border-input text-destructive focus:ring-destructive"
                />
                Allow negative stock override
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Delivery arrived, Damaged items, Discrepancy"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="text-xs rounded-[2px]"
            />
          </div>

          {error && (
            <div className="rounded-[2px] border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-[2px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isSubmitting || (wouldCauseNegativeStock && !overrideStock)
              }
              className="rounded-[2px]"
            >
              {isSubmitting
                ? "Processing..."
                : isStockIn
                  ? "Stock In"
                  : "Stock Out"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
