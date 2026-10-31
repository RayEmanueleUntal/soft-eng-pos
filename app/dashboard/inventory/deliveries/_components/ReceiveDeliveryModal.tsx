"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PurchaseOrder,
  CreateDeliveryPayload,
} from "@/lib/inventory/delivery-types";
import { createDelivery } from "@/lib/inventory/delivery-api";
import { POSearchSelect } from "./POSearchSelect";
import {
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Truck,
} from "lucide-react";

interface ReceiveDeliveryModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactElement;
}

export function ReceiveDeliveryModal({
  onSuccess,
  trigger,
}: ReceiveDeliveryModalProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null);

  // Map of productId -> received_quantity (as string during editing)
  const [receivedQtyMap, setReceivedQtyMap] = React.useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{
    message: string;
    isPartial: boolean;
  } | null>(null);

  // When a PO is selected, initialize the received quantities with requested quantities
  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setError(null);
    const initialMap: Record<number, string> = {};
    po.items.forEach((item) => {
      // Default to the requested quantity for convenience
      initialMap[item.productId] = String(item.requested_quantity);
    });
    setReceivedQtyMap(initialMap);
  };

  const handleQtyChange = (productId: number, val: string) => {
    setReceivedQtyMap((prev) => ({
      ...prev,
      [productId]: val,
    }));
  };

  const handleReset = () => {
    setSelectedPO(null);
    setReceivedQtyMap({});
    setError(null);
    setSuccessInfo(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        handleReset();
      }, 200);
    }
  };

  // Compute variance & validation
  const validationSummary = React.useMemo(() => {
    if (!selectedPO) return { hasDiscrepancy: false, items: [], hasInvalid: false };

    let hasDiscrepancy = false;
    let hasInvalid = false;

    const items = selectedPO.items.map((item) => {
      const rawVal = receivedQtyMap[item.productId] ?? "";
      const numVal = Number(rawVal);
      const isNaN = rawVal.trim() === "" || Number.isNaN(numVal) || numVal < 0;
      if (isNaN) hasInvalid = true;

      const diff = numVal - item.requested_quantity;
      if (diff !== 0) hasDiscrepancy = true;

      return {
        ...item,
        inputQty: numVal,
        isInvalid: isNaN,
        diff,
      };
    });

    return { hasDiscrepancy, items, hasInvalid };
  }, [selectedPO, receivedQtyMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    if (validationSummary.hasInvalid) {
      setError("Please ensure all received quantities are valid non-negative numbers.");
      return;
    }

    const payloadItems = selectedPO.items
      .map((item) => ({
        productId: item.productId,
        received_quantity: Number(receivedQtyMap[item.productId] || 0),
      }))
      .filter((item) => item.received_quantity > 0);

    if (payloadItems.length === 0) {
      setError("At least one product must have a received quantity greater than 0.");
      return;
    }

    const payload: CreateDeliveryPayload = {
      poId: selectedPO.id,
      items: payloadItems,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createDelivery(payload);
      setSuccessInfo({
        message: res.message || "Delivery recorded successfully and stock updated.",
        isPartial: res.isPartial,
      });

      if (onSuccess) {
        onSuccess();
      }

      // Close modal after brief success presentation
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const apiMsg = err.response?.data?.message;

      if (statusCode === 400) {
        setError(
          apiMsg ||
            "Validation failed or business rule violation (e.g., PO not active or products missing).",
        );
      } else if (statusCode === 403) {
        setError("User lacks permission to process deliveries (Stock Management required).");
      } else if (statusCode === 404) {
        setError(apiMsg || `Purchase Order #${selectedPO.id} not found.`);
      } else {
        setError(apiMsg || "Failed to record delivery. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button className="rounded-md gap-2 font-medium text-xs">
              <PackagePlus className="h-4 w-4" /> Receive Delivery
            </Button>
          )
        }
      />

      <DialogContent className="max-w-3xl font-sans max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Process Stock Delivery Intake
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Match incoming stock from supplier shipments against active Purchase Orders.
          </DialogDescription>
        </DialogHeader>

        {/* Success message banner */}
        {successInfo && (
          <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-3 text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{successInfo.message}</p>
              {successInfo.isPartial && (
                <p className="text-[11px] opacity-90">
                  PO was marked as partially fulfilled. Remaining quantities can be delivered later.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!selectedPO ? (
            /* STEP 1: SELECT TARGET PURCHASE ORDER */
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Step 1: Select Active Purchase Order
              </label>
              <POSearchSelect
                onSelectPO={handleSelectPO}
                selectedPOId={null}
              />
            </div>
          ) : (
            /* STEP 2: VERIFY AND ENTER RECEIVED QUANTITIES */
            <div className="space-y-4">
              {/* Selected PO Header Card */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Target Purchase Order
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-foreground text-sm">
                      PO #{selectedPO.id}
                    </span>
                    <Badge variant="outline" className="rounded-sm font-mono text-[10px]">
                      {selectedPO.status || "ACTIVE"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-[11px] block mt-0.5">
                    Supplier: {selectedPO.supplierName || `Supplier #${selectedPO.supplierId}`}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="rounded-md gap-1 text-xs h-8"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change PO
                </Button>
              </div>

              {/* Discrepancy Alert */}
              {validationSummary.hasDiscrepancy && (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold block">Quantity Discrepancy Detected</span>
                    <span className="text-[11px] text-amber-700">
                      Actual received quantities differ from the PO requested amounts. The system will mark partial receipts or account for over-deliveries.
                    </span>
                  </div>
                </div>
              )}

              {/* Items Verification Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">
                        Product
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider font-mono">
                        SKU
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right font-mono">
                        Requested Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider w-36 text-center font-mono">
                        Received Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationSummary.items.map((item) => {
                      const diff = item.diff;
                      return (
                        <TableRow key={item.productId} className="text-xs">
                          <TableCell className="font-medium text-foreground">
                            {item.productName || `Product #${item.productId}`}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {item.productSku || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-foreground tabular-nums">
                            {item.requested_quantity.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={receivedQtyMap[item.productId] ?? ""}
                              onChange={(e) =>
                                handleQtyChange(item.productId, e.target.value)
                              }
                              disabled={isSubmitting}
                              className={`h-8 font-mono text-center text-xs rounded-md ${
                                item.isInvalid
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : diff !== 0
                                  ? "border-amber-400 focus-visible:ring-amber-400"
                                  : ""
                              }`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {diff === 0 ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] rounded-sm font-sans font-medium text-emerald-700 bg-emerald-50 border-emerald-200"
                              >
                                Complete
                              </Badge>
                            ) : diff < 0 ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] rounded-sm font-sans font-medium text-amber-700 bg-amber-50 border-amber-200"
                              >
                                {diff} Partial
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] rounded-sm font-sans font-medium text-blue-700 bg-blue-50 border-blue-200"
                              >
                                +{diff} Extra
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border flex justify-between sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-md text-xs"
            >
              Cancel
            </Button>

            {selectedPO && (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || validationSummary.hasInvalid}
                className="rounded-md text-xs font-semibold uppercase tracking-wider gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording Delivery...
                  </>
                ) : (
                  <>
                    <PackagePlus className="h-4 w-4" />
                    Confirm & Update Stock
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
