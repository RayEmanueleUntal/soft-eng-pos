"use client";

// Cashier exchange request modal for 1-to-1 same-SKU replacement on an invoice.
// Groups receipt lines by productId into a pooled Base UoM balance.
// Posts to POST /returns/exchange and waits for manager approval.

import { useState, useMemo } from "react";
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
import { AlertCircle, Loader2, Info } from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import type {
  Receipt,
  ExchangeRequest,
  ReturnResponse,
  ItemCondition,
  UnitOfMeasure,
} from "@/lib/pos";
import { processExchange, usePosCatalog } from "@/lib/pos";

interface ExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onSuccess: (approvalRequestId: number) => void;
}

interface ExchangeLineDraft {
  quantity: string;
  unitOfMeasure: string;
  reason: string;
}

export function ExchangeModal({
  open,
  onOpenChange,
  receipt,
  onSuccess,
}: ExchangeModalProps) {
  const { products } = usePosCatalog();
  const [drafts, setDrafts] = useState<Record<number, ExchangeLineDraft>>({});
  const [allowStockOverride, setAllowStockOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group receipt lines by productId into a single pooled Base UoM balance per product
  const itemMeta = useMemo(() => {
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

      const purchasedUom = (item.unit_of_measure || item.pricing_uom || "PCS")
        .toString()
        .toUpperCase();

      const catalogProduct = products.find((p) => Number(p.id) === pid) ?? null;

      const baseUom = (item.base_uom || catalogProduct?.base_uom || "PCS")
        .toString()
        .toUpperCase();

      const existing = grouped.get(pid);
      if (existing) {
        existing.totalPurchasedBase += lineBase;
        existing.purchasedUoms.add(purchasedUom);
        existing.uomConversions[purchasedUom] = conv;
      } else {
        grouped.set(pid, {
          productId: pid,
          productName: item.product_name,
          totalPurchasedBase: lineBase,
          purchasedUoms: new Set([purchasedUom]),
          baseUom,
          uomConversions: {
            [baseUom]: 1,
            [purchasedUom]: conv,
          },
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

      const catalogProduct =
        products.find((p) => Number(p.id) === entry.productId) ?? null;

      const allowedUoms = Array.from(
        new Set([entry.baseUom, ...entry.purchasedUoms]),
      ).filter(Boolean);

      const replacementStock =
        catalogProduct?.current_quantity !== undefined
          ? Number(catalogProduct.current_quantity)
          : null;

      return {
        productId: entry.productId,
        productName: entry.productName,
        totalPurchasedBase: Number(entry.totalPurchasedBase.toFixed(3)),
        remainingBase,
        baseUom: entry.baseUom,
        purchasedUoms: entry.purchasedUoms,
        allowedUoms,
        uomConversions: entry.uomConversions,
        replacementStock,
      };
    });
  }, [receipt.items, receipt.returns, receipt.exchanges, products]);

  const selectedProductIds = useMemo(
    () =>
      Object.keys(drafts)
        .map(Number)
        .sort((a, b) => a - b),
    [drafts],
  );

  const toggleProduct = (productId: number) => {
    setError(null);
    setDrafts((prev) => {
      if (prev[productId]) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      const meta = itemMeta.find((m) => m.productId === productId);
      if (!meta || meta.remainingBase <= 0) return prev;
      return {
        ...prev,
        [productId]: {
          quantity: "1",
          unitOfMeasure: meta.baseUom || meta.allowedUoms[0] || "PCS",
          reason: "",
        },
      };
    });
  };

  const updateDraft = (
    productId: number,
    patch: Partial<ExchangeLineDraft>,
  ) => {
    setDrafts((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return {
        ...prev,
        [productId]: { ...existing, ...patch },
      };
    });
  };

  // Check if any selected item's converted base quantity exceeds available replacement stock
  const anyStockInsufficient = useMemo(() => {
    return selectedProductIds.some((pid) => {
      const meta = itemMeta.find((m) => m.productId === pid);
      const draft = drafts[pid];
      if (!meta || !draft || meta.replacementStock === null) return false;
      const conv = meta.uomConversions[draft.unitOfMeasure] ?? 1;
      const requestedBase = Number(draft.quantity || 0) * conv;
      return meta.replacementStock < requestedBase;
    });
  }, [selectedProductIds, itemMeta, drafts]);

  const resetForm = () => {
    setDrafts({});
    setAllowStockOverride(false);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) {
      setError("Please select at least one item to exchange.");
      return;
    }

    const payloadItems: ExchangeRequest["items"] = [];

    for (const pid of selectedProductIds) {
      const meta = itemMeta.find((m) => m.productId === pid);
      const draft = drafts[pid];
      if (!meta || !draft) continue;

      const qty = Number(draft.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError(`Quantity for "${meta.productName}" must be greater than 0.`);
        return;
      }

      if (!draft.unitOfMeasure) {
        setError(`Please select a Unit of Measure for "${meta.productName}".`);
        return;
      }

      const conv = meta.uomConversions[draft.unitOfMeasure] ?? 1;
      const requestedBase = Number((qty * conv).toFixed(3));
      const maxForChosenUom = Number((meta.remainingBase / conv).toFixed(3));

      if (requestedBase > meta.remainingBase) {
        setError(
          `Quantity for "${meta.productName}" cannot exceed available quantity (${maxForChosenUom} ${draft.unitOfMeasure} / ${meta.remainingBase} ${meta.baseUom}).`,
        );
        return;
      }

      if (draft.reason.trim().length < 5) {
        setError(
          `Please provide a reason (minimum 5 characters) for "${meta.productName}".`,
        );
        return;
      }

      if (
        meta.replacementStock !== null &&
        meta.replacementStock < requestedBase &&
        !allowStockOverride
      ) {
        setError(
          `Insufficient replacement stock for "${meta.productName}" (Needs ${requestedBase} ${meta.baseUom}, In stock: ${meta.replacementStock} ${meta.baseUom}). Enable "Manager Stock Override" to proceed.`,
        );
        return;
      }

      payloadItems.push({
        productId: meta.productId,
        quantity: qty,
        unit_of_measure: draft.unitOfMeasure as UnitOfMeasure,
        condition: "DEFECTIVE" as ItemCondition,
        reason: draft.reason.trim(),
      });
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: ExchangeRequest = {
        transactionId: Number(receipt.transactionId),
        items: payloadItems,
        allowStockOverride: Boolean(allowStockOverride),
      };

      const response: ReturnResponse = await processExchange(request);
      onSuccess(response.approvalRequestId);
      handleClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit exchange request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex flex-col sm:max-w-[560px] max-h-[85vh] overflow-hidden rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold font-heading text-center">
            Process Exchange
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            1-to-1 same-product replacement for transaction #
            {receipt.transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Informational Callout */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 p-2.5 rounded-[4px] text-xs leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <strong>1-to-1 Same-Product Replacement Only:</strong> Select one
              or more purchased products to replace with the exact same product
              SKU. To swap into different products, process a{" "}
              <strong>Refund</strong> + <strong>New POS Sale</strong>.
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Multi-Item Pooled Checklist */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Select Items to Exchange ({selectedProductIds.length} selected){" "}
              <span className="text-destructive">*</span>
            </Label>

            <div className="space-y-2">
              {itemMeta.map((meta) => {
                const isSelected = Boolean(drafts[meta.productId]);
                const draft = drafts[meta.productId];
                const disabled = meta.remainingBase <= 0;

                const activeConv = draft
                  ? (meta.uomConversions[draft.unitOfMeasure] ?? 1)
                  : 1;
                const maxForChosenUom = Number(
                  (meta.remainingBase / activeConv).toFixed(3),
                );
                const requestedBase = draft
                  ? Number(draft.quantity || 0) * activeConv
                  : 0;

                const lineStockInsufficient =
                  isSelected &&
                  meta.replacementStock !== null &&
                  meta.replacementStock < requestedBase;

                return (
                  <div
                    key={meta.productId}
                    className={cn(
                      "rounded-[4px] border p-3 transition-colors space-y-3",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card",
                      disabled && "opacity-55",
                    )}
                  >
                    {/* Product Checkbox Row */}
                    <label
                      className={cn(
                        "flex items-start justify-between gap-2",
                        disabled ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => toggleProduct(meta.productId)}
                          className="mt-0.5 rounded-[2px] border-input"
                        />
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {meta.productName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Purchased: {meta.totalPurchasedBase} {meta.baseUom}{" "}
                            ·{" "}
                            {disabled
                              ? "Fully Returned/Exchanged"
                              : `Available: ${meta.remainingBase} ${meta.baseUom}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-mono shrink-0",
                          lineStockInsufficient
                            ? "text-destructive font-bold"
                            : "text-muted-foreground",
                        )}
                      >
                        {meta.replacementStock !== null
                          ? `Stock: ${meta.replacementStock} ${meta.baseUom}`
                          : ""}
                      </span>
                    </label>

                    {/* Expanded Per-Product Controls when checked */}
                    {isSelected && draft && (
                      <div className="pt-2 border-t border-border/60 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Quantity */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label className="text-[11px]">
                                Qty <span className="text-destructive">*</span>
                              </Label>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Max {maxForChosenUom} {draft.unitOfMeasure}
                              </span>
                            </div>
                            <Input
                              type="number"
                              min="0.001"
                              step="any"
                              max={maxForChosenUom}
                              value={draft.quantity}
                              onChange={(e) =>
                                updateDraft(meta.productId, {
                                  quantity: e.target.value,
                                })
                              }
                              className="rounded-[4px] text-xs h-8 bg-background"
                            />
                          </div>

                          {/* UoM */}
                          <div className="space-y-1">
                            <Label className="text-[11px]">
                              UoM <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={draft.unitOfMeasure}
                              onValueChange={(val) =>
                                updateDraft(meta.productId, {
                                  unitOfMeasure: val ?? meta.baseUom,
                                })
                              }
                            >
                              <SelectTrigger className="w-full rounded-[4px] text-xs h-8 bg-background">
                                <SelectValue placeholder="UoM">
                                  {draft.unitOfMeasure}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {meta.allowedUoms.map((uom) => {
                                  const conv = meta.uomConversions[uom] ?? 1;
                                  const tag =
                                    uom === meta.baseUom
                                      ? "(Base)"
                                      : `(1 ${uom} = ${conv} ${meta.baseUom})`;
                                  return (
                                    <SelectItem
                                      key={uom}
                                      value={uom}
                                      className="text-xs"
                                    >
                                      {uom} {tag}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                          <Label className="text-[11px]">
                            Reason <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            value={draft.reason}
                            onChange={(e) =>
                              updateDraft(meta.productId, {
                                reason: e.target.value,
                              })
                            }
                            placeholder="Describe the defect or reason for replacement..."
                            className="rounded-[4px] text-xs min-h-[54px] resize-none bg-background"
                            maxLength={500}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manager Stock Override Toggle */}
          <div className="p-3 rounded-[4px] border border-border bg-muted/40 space-y-1.5">
            {anyStockInsufficient && (
              <p className="text-[11px] text-destructive font-medium">
                ⚠️ One or more selected items have insufficient replacement
                stock.
              </p>
            )}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="stock-override"
                checked={allowStockOverride}
                onChange={(e) => setAllowStockOverride(e.target.checked)}
                disabled={selectedProductIds.length === 0}
                className="mt-0.5 rounded-[2px] border-input"
              />
              <Label
                htmlFor="stock-override"
                className="text-xs cursor-pointer leading-tight text-foreground"
              >
                <span className="font-semibold block">
                  Manager Stock Override
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Allow exchange approval even if replacement inventory is low
                  or zero.
                </span>
              </Label>
            </div>
          </div>
        </div>

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
            disabled={isSubmitting || selectedProductIds.length === 0}
            className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Submit Exchange (${selectedProductIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
