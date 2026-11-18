"use client";

// Cashier refund request modal: check remaining invoice lines, then submit one POST.
// Posts CreateRefundDto.items[] to POST /returns/refund without a uom property (API rejects it).
// Select all remaining checks every unfinished line; UoM is stored in the reason text.

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import {
  ItemCondition,
  type Receipt,
  type ReceiptItem,
  type CreateRefundDto,
  type CreateRefundItemDto,
  type ReturnResponse,
  processRefund,
  usePosCatalog,
} from "@/lib/pos";

/** Remaining refundable qty for a receipt line (item flag vs recorded returns). */
function remainingForItem(item: ReceiptItem, receipt: Receipt): number {
  const fromItem = item.already_returned_qty ?? 0;
  const fromReceiptReturns =
    receipt.returns
      ?.filter((r) => r.productId === item.productId)
      .reduce((sum, r) => sum + (r.quantity || 0), 0) ?? 0;
  const already = Math.max(fromItem, fromReceiptReturns);
  return Math.max(0, item.quantity - already);
}

/** Purchased selling UoM for a line, used in the reason string. */
function purchasedUomFor(item: ReceiptItem): string {
  return (item.unit_of_measure || item.pricing_uom || "PCS")
    .toString()
    .toUpperCase();
}

/** Purchased UoM plus catalog base UoM for a line. */
function allowedUomsFor(
  item: ReceiptItem,
  products: { id: string | number; base_uom?: string | null }[],
): string[] {
  const purchasedUom = purchasedUomFor(item);
  const catalogProduct = products.find(
    (p) => Number(p.id) === Number(item.productId),
  );
  const baseUom = (
    item.base_uom ||
    catalogProduct?.base_uom ||
    purchasedUom
  )
    .toString()
    .toUpperCase();
  return Array.from(new Set([purchasedUom, baseUom])).filter(Boolean);
}

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onSuccess: (approvalRequestId: number) => void;
}

export function RefundModal({
  open,
  onOpenChange,
  receipt,
  onSuccess,
}: RefundModalProps) {
  const { products } = usePosCatalog();

  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [qtyByIndex, setQtyByIndex] = useState<Record<number, string>>({});
  const [uomByIndex, setUomByIndex] = useState<Record<number, string>>({});
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingIndexes = useMemo(
    () =>
      receipt.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => remainingForItem(item, receipt) > 0)
        .map(({ index }) => index),
    [receipt],
  );

  const selectedIndexes = remainingIndexes.filter((index) => checked[index]);
  const allRemainingSelected =
    remainingIndexes.length > 0 &&
    remainingIndexes.every((index) => checked[index]);

  const invoiceLabel =
    receipt.invoice_number || `INV-${receipt.transactionId}`;

  /** Seeds qty/UoM maps when the modal opens; leaves checkboxes empty. */
  useEffect(() => {
    if (!open) return;
    const nextQty: Record<number, string> = {};
    const nextUom: Record<number, string> = {};
    receipt.items.forEach((item, index) => {
      const remaining = remainingForItem(item, receipt);
      if (remaining <= 0) return;
      nextQty[index] = String(remaining);
      nextUom[index] = purchasedUomFor(item);
    });
    setQtyByIndex(nextQty);
    setUomByIndex(nextUom);
    setChecked({});
    setCondition(null);
    setReason("");
    setError(null);
  }, [open, receipt]);

  const resetForm = () => {
    setChecked({});
    setQtyByIndex({});
    setUomByIndex({});
    setCondition(null);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  /** Checks or clears every remaining line. */
  const handleToggleSelectAll = () => {
    if (allRemainingSelected) {
      setChecked({});
      return;
    }
    const next: Record<number, boolean> = {};
    remainingIndexes.forEach((index) => {
      next[index] = true;
    });
    setChecked(next);
  };

  /** Toggles one remaining line and keeps its default remaining qty. */
  const handleToggleLine = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async () => {
    if (selectedIndexes.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    if (!condition) {
      setError("Please select an item condition (Defective or Change of Mind).");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Please provide a return reason (minimum 5 characters).");
      return;
    }

    const items: CreateRefundItemDto[] = [];
    for (const index of selectedIndexes) {
      const item = receipt.items[index];
      const remaining = remainingForItem(item, receipt);
      const qty = Number(qtyByIndex[index]);
      const uom = (uomByIndex[index] || purchasedUomFor(item)).toUpperCase();

      if (!item?.productId) {
        setError("A selected line is missing a product id.");
        return;
      }
      if (isNaN(qty) || qty <= 0) {
        setError(`Quantity for ${item.product_name} must be greater than 0.`);
        return;
      }
      if (qty > remaining) {
        setError(
          `Quantity for ${item.product_name} cannot exceed remaining ${remaining} ${uom}.`,
        );
        return;
      }
      if (!uom) {
        setError(`Select a unit of measure for ${item.product_name}.`);
        return;
      }

      items.push({
        productId: Number(item.productId),
        quantity: qty,
        condition,
        reason: `${reason.trim()} (UoM: ${uom})`,
      });
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestPayload: CreateRefundDto = {
        transactionId: Number(receipt.transactionId),
        items,
      };
      const response: ReturnResponse = await processRefund(requestPayload);
      onSuccess(response.approvalRequestId);
      handleClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit refund request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    selectedIndexes.length > 0 &&
    !!condition &&
    reason.trim().length >= 5 &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex flex-col sm:max-w-[560px] max-h-[85vh] overflow-hidden rounded-[4px] border border-input bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold font-heading text-center">
            Process Refund
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            Check items to return on {invoiceLabel}. Stay on this invoice after
            submit to wait for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-3.5 pr-1">
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">
                Items to return <span className="text-destructive">*</span>
              </Label>
              {remainingIndexes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleSelectAll}
                  disabled={isSubmitting}
                  className="h-7 rounded-[4px] text-[11px] border-input px-2"
                >
                  {allRemainingSelected
                    ? "Clear selection"
                    : "Select all remaining"}
                </Button>
              )}
            </div>

            {remainingIndexes.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-input rounded-[4px] p-2.5">
                Nothing left to refund on this invoice.
              </p>
            ) : (
              <div className="border border-input rounded-[4px] divide-y divide-border">
                {remainingIndexes.map((index) => {
                  const item = receipt.items[index];
                  const remaining = remainingForItem(item, receipt);
                  const uoms = allowedUomsFor(item, products);
                  const isChecked = !!checked[index];
                  const lineUom = uomByIndex[index] || purchasedUomFor(item);

                  return (
                    <div
                      key={`${item.productId ?? "line"}-${index}`}
                      className="p-2.5 space-y-2"
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLine(index)}
                          disabled={isSubmitting}
                          className="mt-0.5 rounded-[2px] border-input"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground leading-tight">
                            {item.product_name}
                          </span>
                          <span className="block text-[10px] font-mono text-muted-foreground">
                            {remaining} / {item.quantity}{" "}
                            {purchasedUomFor(item)} remaining
                          </span>
                        </span>
                      </label>

                      {isChecked && (
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`qty-${index}`}
                              className="text-[10px] font-medium"
                            >
                              Qty
                            </Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min="0.01"
                              step="any"
                              max={remaining}
                              value={qtyByIndex[index] ?? ""}
                              onChange={(e) =>
                                setQtyByIndex((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
                              disabled={isSubmitting}
                              className="rounded-[4px] text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`uom-${index}`}
                              className="text-[10px] font-medium"
                            >
                              UoM
                            </Label>
                            <Select
                              value={lineUom}
                              onValueChange={(val) =>
                                setUomByIndex((prev) => ({
                                  ...prev,
                                  [index]: val ?? purchasedUomFor(item),
                                }))
                              }
                              disabled={isSubmitting || uoms.length === 0}
                            >
                              <SelectTrigger
                                id={`uom-${index}`}
                                className="w-full rounded-[4px] text-xs h-8 font-mono"
                              >
                                <SelectValue>{lineUom}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {uoms.map((uom) => (
                                  <SelectItem
                                    key={uom}
                                    value={uom}
                                    className="text-xs font-mono"
                                  >
                                    {uom}
                                    {uom === purchasedUomFor(item)
                                      ? " (Purchased)"
                                      : " (Base)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condition" className="text-xs font-medium">
              Item Condition <span className="text-destructive">*</span>
            </Label>
            <Select
              value={condition || ""}
              onValueChange={(value) => setCondition(value as ItemCondition)}
              disabled={remainingIndexes.length === 0}
            >
              <SelectTrigger
                id="condition"
                className="w-full rounded-[4px] text-xs h-8"
              >
                <SelectValue placeholder="Select condition">
                  {condition === "DEFECTIVE"
                    ? "Defective"
                    : condition === "CHANGE_OF_MIND"
                      ? "Change of Mind"
                      : "Select condition"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFECTIVE" className="text-xs">
                  Defective
                </SelectItem>
                <SelectItem value="CHANGE_OF_MIND" className="text-xs">
                  Change of Mind
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-medium">
              Reason for Return <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the defect or reason for the refund request..."
              disabled={remainingIndexes.length === 0}
              className="rounded-[4px] text-xs min-h-[70px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {reason.length}/500
            </p>
          </div>
        </div>

        <p className="shrink-0 text-[10px] text-muted-foreground font-sans">
          {selectedIndexes.length === 0
            ? "Check one or more lines, or Select all remaining."
            : `Submitting ${selectedIndexes.length} line(s) for ${invoiceLabel}.`}
        </p>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-[4px] text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
