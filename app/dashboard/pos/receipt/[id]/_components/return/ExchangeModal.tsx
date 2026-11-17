"use client";

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
import { AlertCircle, Loader2, Info } from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import type {
  Receipt,
  ExchangeRequest,
  ReturnResponse,
  ItemCondition,
} from "@/lib/pos";
import { processExchange, usePosCatalog } from "@/lib/pos";

interface ExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onSuccess: (approvalRequestId: number) => void;
}

export function ExchangeModal({
  open,
  onOpenChange,
  receipt,
  onSuccess,
}: ExchangeModalProps) {
  const { products } = usePosCatalog();
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedUom, setSelectedUom] = useState<string>("");
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [reason, setReason] = useState("");
  const [allowStockOverride, setAllowStockOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem =
    selectedItemIndex !== null ? receipt.items[selectedItemIndex] : null;

  // Calculate already returned / exchanged quantity
  const alreadyReturned = useMemo(() => {
    if (!selectedItem) return 0;
    const fromItem = selectedItem.already_returned_qty ?? 0;
    const fromReceiptReturns =
      receipt.returns
        ?.filter((r) => r.productId === selectedItem.productId)
        .reduce((sum, r) => sum + (r.quantity || 0), 0) ?? 0;
    const fromReceiptExchanges =
      receipt.exchanges
        ?.filter((e) => e.productId === selectedItem.productId)
        .reduce((sum, e) => sum + (e.quantity || 0), 0) ?? 0;
    return Math.max(fromItem, fromReceiptReturns + fromReceiptExchanges);
  }, [selectedItem, receipt.returns, receipt.exchanges]);

  const maxQuantity = Math.max(
    0,
    (selectedItem?.quantity ?? 0) - alreadyReturned,
  );

  // Look up catalog product for base UoM & inventory stock
  const catalogProduct = useMemo(() => {
    if (!selectedItem) return null;
    return (
      products.find(
        (p) => Number(p.id) === Number(selectedItem.productId),
      ) ?? null
    );
  }, [selectedItem, products]);

  // Restrict UoM strictly to purchased UoM and base UoM
  const allowedUoms = useMemo(() => {
    if (!selectedItem) return [];
    const purchasedUom = (
      selectedItem.unit_of_measure ||
      selectedItem.pricing_uom ||
      "PCS"
    ).toString().toUpperCase();

    const baseUom = (
      selectedItem.base_uom ||
      catalogProduct?.base_uom ||
      purchasedUom
    ).toString().toUpperCase();

    return Array.from(new Set([purchasedUom, baseUom])).filter(Boolean);
  }, [selectedItem, catalogProduct]);

  // Auto-initialize UoM and Quantity when selected item changes
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

  // Stock sufficiency check for replacement
  const replacementStock =
    catalogProduct?.current_quantity !== undefined
      ? Number(catalogProduct.current_quantity)
      : null;
  const isStockInsufficient =
    replacementStock !== null && replacementStock < Number(quantity);

  const resetForm = () => {
    setSelectedItemIndex(null);
    setQuantity("1");
    setSelectedUom("");
    setCondition(null);
    setReason("");
    setAllowStockOverride(false);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (selectedItemIndex === null || !selectedItem?.productId) {
      setError("Please select an item to exchange.");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (maxQuantity <= 0) {
      setError("This item has already been fully returned or exchanged.");
      return;
    }

    if (qty > maxQuantity) {
      setError(`Quantity cannot exceed available quantity (${maxQuantity}).`);
      return;
    }

    if (!selectedUom) {
      setError("Please select a Unit of Measure (UoM).");
      return;
    }

    if (!condition) {
      setError("Please select an item condition.");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Please provide a reason (minimum 5 characters).");
      return;
    }

    // Require override toggle if stock is known and insufficient
    if (isStockInsufficient && !allowStockOverride) {
      setError(
        `Replacement inventory is insufficient (Current stock: ${replacementStock}). Check "Manager Stock Override" to proceed.`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formattedReason = selectedUom
        ? `${reason.trim()} (UoM: ${selectedUom})`
        : reason.trim();

      const request: ExchangeRequest = {
        transactionId: Number(receipt.transactionId),
        items: [
          {
            productId: Number(selectedItem.productId),
            quantity: qty,
            condition,
            reason: formattedReason,
          },
        ],
        newProductId: Number(selectedItem.productId),
        newQuantity: qty,
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
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-center">
            Process Exchange
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            1-to-1 same-product replacement for transaction #{receipt.transactionId}
          </DialogDescription>
        </DialogHeader>

        {/* Informational Callout for Cashier */}
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 p-2.5 rounded-[4px] text-xs leading-relaxed">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <strong>1-to-1 Same-Product Replacement Only:</strong> Exchanges are strictly for replacing defective items with the same product SKU. For swapping different items or multiple SKUs, please cancel and process a <strong>Refund</strong> + <strong>New POS Sale</strong>.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* Item Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="item-select" className="text-xs font-medium">
              Select Item to Exchange <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedItemIndex !== null ? String(selectedItemIndex) : ""}
              onValueChange={(value) => {
                setSelectedItemIndex(Number(value));
              }}
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
                  const itemReturned =
                    (item.already_returned_qty ?? 0) +
                    (receipt.returns
                      ?.filter((r) => r.productId === item.productId)
                      .reduce((sum, r) => sum + (r.quantity || 0), 0) ?? 0) +
                    (receipt.exchanges
                      ?.filter((e) => e.productId === item.productId)
                      .reduce((sum, e) => sum + (e.quantity || 0), 0) ?? 0);
                  const remaining = Math.max(0, item.quantity - itemReturned);

                  return (
                    <SelectItem
                      key={index}
                      value={String(index)}
                      className="text-xs"
                      disabled={remaining <= 0}
                    >
                      {item.product_name} (Purchased: {item.quantity}
                      {item.pricing_uom ? ` ${item.pricing_uom}` : ""})
                      {remaining <= 0
                        ? " - Fully Returned/Exchanged"
                        : ` [Available: ${remaining}]`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity and UoM Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="quantity" className="text-xs font-medium">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Max: {maxQuantity}
                </span>
              </div>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!selectedItem || maxQuantity === 0}
                className="rounded-[4px] text-xs h-8"
              />
            </div>

            {/* UoM Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="uom-select" className="text-xs font-medium">
                Unit of Measure (UoM) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUom}
                onValueChange={(val) => setSelectedUom(val ?? "")}
                disabled={!selectedItem || allowedUoms.length === 0}
              >
                <SelectTrigger id="uom-select" className="w-full rounded-[4px] text-xs h-8">
                  <SelectValue placeholder="Select UoM">
                    {selectedUom || "Select UoM"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allowedUoms.map((uom) => {
                    const purchasedUom = (
                      selectedItem?.unit_of_measure ||
                      selectedItem?.pricing_uom ||
                      ""
                    ).toUpperCase();
                    const isPurchased = uom === purchasedUom;
                    return (
                      <SelectItem key={uom} value={uom} className="text-xs">
                        {uom} {isPurchased ? "(Purchased)" : "(Base)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Item Condition */}
          <div className="space-y-1.5">
            <Label htmlFor="condition-select" className="text-xs font-medium">
              Item Condition <span className="text-destructive">*</span>
            </Label>
            <Select
              value={condition || ""}
              onValueChange={(value) => setCondition(value as ItemCondition)}
              disabled={!selectedItem}
            >
              <SelectTrigger id="condition-select" className="w-full rounded-[4px] text-xs h-8">
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

          {/* Reason for Exchange */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-medium">
              Reason for Exchange <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the defect or reason for same-product replacement..."
              disabled={!selectedItem}
              className="rounded-[4px] text-xs min-h-[70px] resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {reason.length}/500
            </p>
          </div>

          {/* Replacement Stock & Stock Override Toggle */}
          <div className="p-3 rounded-[4px] border border-border bg-muted/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Replacement Inventory Stock:
              </span>
              <span
                className={cn(
                  "font-mono font-bold",
                  isStockInsufficient
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {replacementStock !== null ? `${replacementStock} in stock` : "N/A"}
              </span>
            </div>

            {isStockInsufficient && (
              <p className="text-[11px] text-destructive font-medium">
                ⚠️ Replacement stock is insufficient for this exchange quantity.
              </p>
            )}

            <div className="flex items-start space-x-2 pt-1 border-t border-border/50">
              <input
                type="checkbox"
                id="stock-override"
                checked={allowStockOverride}
                onChange={(e) => setAllowStockOverride(e.target.checked)}
                disabled={!selectedItem}
                className="mt-0.5 rounded-[2px] border-input"
              />
              <Label
                htmlFor="stock-override"
                className="text-xs cursor-pointer leading-tight text-foreground"
              >
                <span className="font-semibold block">Manager Stock Override</span>
                <span className="text-[10px] text-muted-foreground">
                  Allow exchange approval even if replacement inventory is low or zero.
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
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
            disabled={isSubmitting || !selectedItem || maxQuantity <= 0}
            className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Exchange"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
