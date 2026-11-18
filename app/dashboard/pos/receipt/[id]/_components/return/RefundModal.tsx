"use client";

// Cashier refund request modal for one SKU or every remaining line on an invoice.
// Posts CreateRefundDto.items[] to POST /returns/refund and waits for manager approval.
// Single-item form is unchanged; Refund all remaining reuses condition and reason.

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

/** Purchased selling UoM for a line, used on refund payloads. */
function purchasedUomFor(item: ReceiptItem): string {
  return (
    item.unit_of_measure ||
    item.pricing_uom ||
    "PCS"
  )
    .toString()
    .toUpperCase();
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

  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedUom, setSelectedUom] = useState<string>("");
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem =
    selectedItemIndex !== null ? receipt.items[selectedItemIndex] : null;

  const remainingLines = useMemo(
    () =>
      receipt.items.filter((item) => remainingForItem(item, receipt) > 0),
    [receipt],
  );

  // Remaining refundable quantity on the selected line
  const maxQuantity = selectedItem
    ? remainingForItem(selectedItem, receipt)
    : 0;

  // Derive allowed UoMs strictly restricted to: [purchasedUom, baseUom]
  const allowedUoms = useMemo(() => {
    if (!selectedItem) return [];

    const purchasedUom = (
      selectedItem.unit_of_measure ||
      selectedItem.pricing_uom ||
      "PCS"
    ).toString().toUpperCase();

    // Look up product in catalog to find canonical base_uom if missing on line item
    const catalogProduct = products.find(
      (p) => Number(p.id) === Number(selectedItem.productId),
    );
    const baseUom = (
      selectedItem.base_uom ||
      catalogProduct?.base_uom ||
      purchasedUom
    ).toString().toUpperCase();

    return Array.from(new Set([purchasedUom, baseUom])).filter(Boolean);
  }, [selectedItem, products]);

  // When selected item changes, auto-default UoM to purchasedUom and reset quantity
  useEffect(() => {
    if (selectedItem) {
      const defaultUom =
        selectedItem.unit_of_measure ||
        selectedItem.pricing_uom ||
        allowedUoms[0] ||
        "PCS";
      setSelectedUom(defaultUom.toString().toUpperCase());
      setQuantity(maxQuantity > 0 ? "1" : "0");
    }
  }, [selectedItemIndex]);

  const resetForm = () => {
    setSelectedItemIndex(null);
    setQuantity("1");
    setSelectedUom("");
    setCondition(null);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (selectedItemIndex === null || !selectedItem?.productId) {
      setError("Please select an item to return.");
      return;
    }

    if (maxQuantity <= 0) {
      setError("This item has already been fully returned.");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (qty > maxQuantity) {
      setError(
        `Quantity cannot exceed remaining refundable quantity (${maxQuantity} ${selectedUom}).`,
      );
      return;
    }

    if (!selectedUom) {
      setError("Please select a valid unit of measure (UoM).");
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

    setIsSubmitting(true);
    setError(null);

    try {
      // Build DTO: includes both root fields and nested items array for complete backend compatibility
    const formattedReason = selectedUom
        ? `${reason.trim()} (UoM: ${selectedUom})`
        : reason.trim();
      const refundItem = {
        productId: Number(selectedItem.productId),
        quantity: qty,
        condition,
        reason: formattedReason,
      };
      const requestPayload: CreateRefundDto = {
        transactionId: Number(receipt.transactionId),
        items: [refundItem],
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

  /** Submits every unfinished line in one POST using shared condition/reason. */
  const handleRefundAllRemaining = async () => {
    if (remainingLines.length === 0) {
      setError("There are no remaining quantities to refund.");
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

    setIsSubmitting(true);
    setError(null);

    try {
      const items: CreateRefundItemDto[] = remainingLines.map((item) => {
        const uom = purchasedUomFor(item);
        return {
          productId: Number(item.productId),
          quantity: remainingForItem(item, receipt),
          condition,
          reason: `${reason.trim()} (UoM: ${uom})`,
          uom,
        };
      });
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

  const canRefundAll =
    remainingLines.length >= 1 &&
    !!condition &&
    reason.trim().length >= 5 &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex flex-col sm:max-w-[520px] max-h-[85vh] overflow-hidden rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold font-heading text-center">
            Process Refund
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            Select an item, UoM, condition, and reason for transaction #{receipt.transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-3.5 pr-1">
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* 1. Item Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="item-select" className="text-xs font-medium">
              Select Item to Return <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedItemIndex !== null ? String(selectedItemIndex) : ""}
              onValueChange={(value) => setSelectedItemIndex(Number(value))}
            >
              <SelectTrigger id="item-select" className="w-full rounded-[4px] text-xs h-8">
                <SelectValue placeholder="Choose an item from receipt">
                  {(val: string | null) => {
                    if (val === null || val === "" || val === undefined) {
                      return "Choose an item from receipt";
                    }
                    const idx = Number(val);
                    const it = receipt.items[idx];
                    return it ? `${it.product_name} (Qty: ${it.quantity})` : "Choose an item from receipt";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {receipt.items.map((item, index) => {
                  const remaining = remainingForItem(item, receipt);

                  return (
                    <SelectItem
                      key={index}
                      value={String(index)}
                      disabled={remaining <= 0}
                      className="text-xs"
                    >
                      {item.product_name} — {remaining} / {item.quantity}{" "}
                      {item.unit_of_measure || item.pricing_uom || "PCS"} available
                      {remaining <= 0 ? " (Fully Returned)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Quantity & UoM Selection */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="quantity" className="text-xs font-medium">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                {selectedItem && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Max: {maxQuantity}
                  </span>
                )}
              </div>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="any"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!selectedItem || maxQuantity <= 0}
                className="rounded-[4px] text-xs h-8 font-mono"
              />
            </div>

            {/* UoM Dropdown: strictly purchased UoM vs base UoM */}
            <div className="space-y-1.5">
              <Label htmlFor="uom-select" className="text-xs font-medium">
                Unit of Measure (UoM) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUom}
                onValueChange={(val) => setSelectedUom(val ?? "")}
                disabled={!selectedItem || allowedUoms.length === 0}
              >
                <SelectTrigger id="uom-select" className="w-full rounded-[4px] text-xs h-8 font-mono">
                  <SelectValue placeholder="Select UoM">
                    {selectedUom || "Select UoM"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allowedUoms.map((uom) => {
                    const isPurchased =
                      uom.toUpperCase() ===
                      (selectedItem?.unit_of_measure || selectedItem?.pricing_uom || "PCS")
                        .toString()
                        .toUpperCase();
                    return (
                      <SelectItem key={uom} value={uom} className="text-xs font-mono">
                        {uom} {isPurchased ? "(Purchased UoM)" : "(Base UoM)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Condition */}
          <div className="space-y-1.5">
            <Label htmlFor="condition" className="text-xs font-medium">
              Item Condition <span className="text-destructive">*</span>
            </Label>
            <Select
              value={condition || ""}
              onValueChange={(value) => setCondition(value as ItemCondition)}
              disabled={!selectedItem && remainingLines.length === 0}
            >
              <SelectTrigger id="condition" className="w-full rounded-[4px] text-xs h-8">
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

          {/* 4. Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-medium">
              Reason for Return <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the defect or reason for the refund request..."
              disabled={!selectedItem && remainingLines.length === 0}
              className="rounded-[4px] text-xs min-h-[70px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {reason.length}/500
            </p>
          </div>
        </div>
        </div>

        {remainingLines.length >= 1 && (
          <p className="shrink-0 text-[10px] text-muted-foreground font-sans">
            This will request a refund of {remainingLines.length} line(s). Fill
            condition and reason, then Refund all remaining.
          </p>
        )}

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
          {remainingLines.length >= 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRefundAllRemaining}
              disabled={!canRefundAll}
              className="rounded-[4px] text-xs border-input hover:bg-muted"
            >
              Refund all remaining
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedItem || maxQuantity <= 0}
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