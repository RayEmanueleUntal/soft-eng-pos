"use client";

// Cashier refund request modal: pools receipt lines by productId in Base UoM,
// accounts for prior returns and exchanges, and posts CreateRefundDto to POST /returns/refund.

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
  type UnitOfMeasure,
  type Receipt,
  type CreateRefundDto,
  type CreateRefundItemDto,
  type ReturnResponse,
  processRefund,
  usePosCatalog,
} from "@/lib/pos";

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
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, string>>({});
  const [uomByProduct, setUomByProduct] = useState<Record<number, string>>({});
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pool receipt lines by productId into a single Base UoM refundable balance
  const pooledItems = useMemo(() => {
    const grouped = new Map<
      number,
      {
        productId: number;
        productName: string;
        totalPurchasedBase: number;
        purchasedUoms: Set<string>;
        baseUom: string;
        uomConversions: Record<string, number>;
      }
    >();

    for (const item of receipt.items) {
      if (!item.productId) continue;
      const pid = Number(item.productId);
      const conv = Number(item.uom_conversion_factor) || 1;
      const lineBase =
        item.base_quantity_deducted !== undefined
          ? Number(item.base_quantity_deducted)
          : (item.quantity ?? 0) * conv;

      const purchasedUom = (item.unit_of_measure || item.pricing_uom || "")
        .toString()
        .trim()
        .toUpperCase();

      const catalogProduct = products.find((p) => Number(p.id) === pid) ?? null;

      // Never hardcode "PCS" — resolve from item, catalog, or the purchased UoM itself
      const baseUom = (
        item.base_uom ||
        catalogProduct?.base_uom ||
        purchasedUom
      )
        .toString()
        .trim()
        .toUpperCase();

      const existing = grouped.get(pid);
      if (existing) {
        existing.totalPurchasedBase += lineBase;
        if (purchasedUom) {
          existing.purchasedUoms.add(purchasedUom);
          existing.uomConversions[purchasedUom] = conv;
        }
        if (!existing.baseUom && baseUom) {
          existing.baseUom = baseUom;
          existing.uomConversions[baseUom] = 1;
        }
      } else {
        const conversions: Record<string, number> = {};
        if (baseUom) conversions[baseUom] = 1;
        if (purchasedUom) conversions[purchasedUom] = conv;

        grouped.set(pid, {
          productId: pid,
          productName: item.product_name,
          totalPurchasedBase: lineBase,
          purchasedUoms: new Set(purchasedUom ? [purchasedUom] : []),
          baseUom,
          uomConversions: conversions,
        });
      }
    }

    return Array.from(grouped.values()).map((entry) => {
      const returnedBase =
        receipt.returns
          ?.filter((r) => Number(r.productId) === entry.productId)
          .reduce((sum, r) => sum + Number(r.quantity || 0), 0) ?? 0;

      const exchangedBase =
        receipt.exchanges
          ?.filter((e) => Number(e.productId) === entry.productId)
          .reduce((sum, e) => sum + Number(e.quantity || 0), 0) ?? 0;

      const remainingBase = Math.max(
        0,
        Number(
          (entry.totalPurchasedBase - returnedBase - exchangedBase).toFixed(3),
        ),
      );

      const allowedUoms = Array.from(
        new Set([entry.baseUom, ...entry.purchasedUoms]),
      ).filter(Boolean);

      const resolvedBaseUom = entry.baseUom || allowedUoms[0] || "";

      return {
        productId: entry.productId,
        productName: entry.productName,
        totalPurchasedBase: Number(entry.totalPurchasedBase.toFixed(3)),
        remainingBase,
        baseUom: resolvedBaseUom,
        allowedUoms,
        uomConversions: entry.uomConversions,
      };
    });
  }, [receipt.items, receipt.returns, receipt.exchanges, products]);

  const remainingProducts = useMemo(
    () => pooledItems.filter((item) => item.remainingBase > 0),
    [pooledItems],
  );

  const selectedProductIds = useMemo(
    () =>
      remainingProducts
        .filter((item) => checked[item.productId])
        .map((item) => item.productId),
    [remainingProducts, checked],
  );

  const allRemainingSelected =
    remainingProducts.length > 0 &&
    remainingProducts.every((item) => checked[item.productId]);

  const invoiceLabel = receipt.invoice_number || `INV-${receipt.transactionId}`;

  /** Seeds default Base UoM qty/UoM maps when the modal opens. */
  useEffect(() => {
    if (!open) return;
    const nextQty: Record<number, string> = {};
    const nextUom: Record<number, string> = {};
    remainingProducts.forEach((item) => {
      nextQty[item.productId] = String(item.remainingBase);
      nextUom[item.productId] = item.baseUom;
    });
    setQtyByProduct(nextQty);
    setUomByProduct(nextUom);
    setChecked({});
    setCondition(null);
    setReason("");
    setError(null);
  }, [open, remainingProducts]);

  const resetForm = () => {
    setChecked({});
    setQtyByProduct({});
    setUomByProduct({});
    setCondition(null);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleToggleSelectAll = () => {
    if (allRemainingSelected) {
      setChecked({});
      return;
    }
    const next: Record<number, boolean> = {};
    remainingProducts.forEach((item) => {
      next[item.productId] = true;
    });
    setChecked(next);
  };

  const handleToggleProduct = (productId: number) => {
    setChecked((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleUomChange = (
    productId: number,
    newUom: string,
    remainingBase: number,
    uomConversions: Record<string, number>,
  ) => {
    setUomByProduct((prev) => ({ ...prev, [productId]: newUom }));
    const conv = uomConversions[newUom] ?? 1;
    const maxForUom = Number((remainingBase / conv).toFixed(3));
    setQtyByProduct((prev) => {
      const currentQty = Number(prev[productId] || 0);
      if (currentQty > maxForUom) {
        return { ...prev, [productId]: String(maxForUom) };
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    if (!condition) {
      setError(
        "Please select an item condition (Defective or Change of Mind).",
      );
      return;
    }

    if (reason.trim().length < 5) {
      setError("Please provide a return reason (minimum 5 characters).");
      return;
    }

    const items: CreateRefundItemDto[] = [];
    for (const pid of selectedProductIds) {
      const meta = remainingProducts.find((m) => m.productId === pid);
      if (!meta) continue;

      const qty = Number(qtyByProduct[pid]);
      const uom = (uomByProduct[pid] || meta.baseUom).toUpperCase();
      const conv = meta.uomConversions[uom] ?? 1;
      const requestedBase = Number((qty * conv).toFixed(3));
      const maxForChosenUom = Number((meta.remainingBase / conv).toFixed(3));

      if (isNaN(qty) || qty <= 0) {
        setError(`Quantity for ${meta.productName} must be greater than 0.`);
        return;
      }
      if (!uom) {
        setError(`Select a unit of measure for ${meta.productName}.`);
        return;
      }
      if (requestedBase > meta.remainingBase) {
        setError(
          `Quantity for ${meta.productName} cannot exceed remaining ${maxForChosenUom} ${uom} (${meta.remainingBase} ${meta.baseUom}).`,
        );
        return;
      }

      items.push({
        productId: meta.productId,
        quantity: qty,
        unit_of_measure: uom as UnitOfMeasure,
        condition,
        reason: reason.trim(),
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
    selectedProductIds.length > 0 &&
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
              {remainingProducts.length > 0 && (
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

            {remainingProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-input rounded-[4px] p-2.5">
                Nothing left to refund on this invoice.
              </p>
            ) : (
              <div className="border border-input rounded-[4px] divide-y divide-border">
                {remainingProducts.map((meta) => {
                  const isChecked = !!checked[meta.productId];
                  const selectedUom =
                    uomByProduct[meta.productId] || meta.baseUom;
                  const activeConv = meta.uomConversions[selectedUom] ?? 1;
                  const maxForChosenUom = Number(
                    (meta.remainingBase / activeConv).toFixed(3),
                  );

                  return (
                    <div key={meta.productId} className="p-2.5 space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProduct(meta.productId)}
                          disabled={isSubmitting}
                          className="mt-0.5 rounded-[2px] border-input"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground leading-tight">
                            {meta.productName}
                          </span>
                          <span className="block text-[10px] font-mono text-muted-foreground">
                            {meta.remainingBase} / {meta.totalPurchasedBase}{" "}
                            {meta.baseUom} remaining
                          </span>
                        </span>
                      </label>

                      {isChecked && (
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor={`qty-${meta.productId}`}
                                className="text-[10px] font-medium"
                              >
                                Qty
                              </Label>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                Max {maxForChosenUom} {selectedUom}
                              </span>
                            </div>
                            <Input
                              id={`qty-${meta.productId}`}
                              type="number"
                              min="0.001"
                              step="any"
                              max={maxForChosenUom}
                              value={qtyByProduct[meta.productId] ?? ""}
                              onChange={(e) =>
                                setQtyByProduct((prev) => ({
                                  ...prev,
                                  [meta.productId]: e.target.value,
                                }))
                              }
                              disabled={isSubmitting}
                              className="rounded-[4px] text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`uom-${meta.productId}`}
                              className="text-[10px] font-medium"
                            >
                              UoM
                            </Label>
                            <Select
                              value={selectedUom}
                              onValueChange={(val) =>
                                handleUomChange(
                                  meta.productId,
                                  val ?? meta.baseUom,
                                  meta.remainingBase,
                                  meta.uomConversions,
                                )
                              }
                              disabled={
                                isSubmitting || meta.allowedUoms.length === 0
                              }
                            >
                              <SelectTrigger
                                id={`uom-${meta.productId}`}
                                className="w-full rounded-[4px] text-xs h-8 font-mono"
                              >
                                <SelectValue>{selectedUom}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {meta.allowedUoms.map((uom) => {
                                  const conv = meta.uomConversions[uom] ?? 1;
                                  const tag =
                                    uom === meta.baseUom
                                      ? " (Base)"
                                      : ` (1 ${uom} = ${conv} ${meta.baseUom})`;
                                  return (
                                    <SelectItem
                                      key={uom}
                                      value={uom}
                                      className="text-xs font-mono"
                                    >
                                      {uom}
                                      {tag}
                                    </SelectItem>
                                  );
                                })}
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
            <Select<string>
              value={condition ?? null}
              onValueChange={(value) =>
                setCondition((value as ItemCondition) || null)
              }
              disabled={remainingProducts.length === 0}
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
              disabled={remainingProducts.length === 0}
              className="rounded-[4px] text-xs min-h-[70px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {reason.length}/500
            </p>
          </div>
        </div>

        <p className="shrink-0 text-[10px] text-muted-foreground font-sans">
          {selectedProductIds.length === 0
            ? "Check one or more items, or Select all remaining."
            : `Submitting ${selectedProductIds.length} item(s) for ${invoiceLabel}.`}
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
