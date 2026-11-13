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
  PurchaseOrder,
  CreateDeliveryPayload,
} from "@/lib/inventory/delivery-types";
import {
  createDelivery,
  fetchPurchaseOrderById,
} from "@/lib/inventory/delivery-api";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { POSelectList } from "./POSelectList";
import {
  PackagePlus,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Pencil,
  RotateCcw,
  Truck,
  Plus,
} from "lucide-react";

interface ReceiveDeliveryModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactElement;
}

// Mirrors the backend Prisma enum UnitOfMeasure (may change in the future)
const UOM_OPTIONS = [
  "PCS",
  "BOX",
  "SET",
  "KG",
  "G",
  "METER",
  "HUNDRED",
  "GROSS",
  "SACK",
  "SACKs",
];

interface LineInput {
  qty: string;
  uom: string;
  factor: string;
  base: string | null; // manual override of actual base qty (null = computed)
  confirming: boolean; // showing the "are you sure?" prompt
  unlocked: boolean; // user confirmed they want to edit UoM/factor/base
}

const labelClass =
  "text-[11px] font-medium text-muted-foreground uppercase tracking-wider";

export function ReceiveDeliveryModal({
  onSuccess,
  trigger,
}: ReceiveDeliveryModalProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(
    null,
  );
  const [loadingPO, setLoadingPO] = React.useState(false);
  const [lines, setLines] = React.useState<Record<number, LineInput>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{
    message: string;
    isPartial: boolean;
  } | null>(null);

  const handleSelectPO = async (po: PurchaseOrder) => {
    setLoadingPO(true);
    setError(null);
    try {
      const full = await fetchPurchaseOrderById(po.id);
      const initial: Record<number, LineInput> = {};
      (full.items ?? []).forEach((item) => {
        initial[item.productId] = {
          qty: String(item.requested_quantity),
          uom: item.ordered_uom,
          factor: String(item.uom_conversion_factor),
          base: null,
          confirming: false,
          unlocked: false,
        };
      });
      setLines(initial);
      setSelectedPO(full);
    } catch (err) {
      setError(
        getErrorMessage(err, `Could not load Purchase Order #${po.id}.`),
      );
    } finally {
      setLoadingPO(false);
    }
  };

  const updateLine = (productId: number, patch: Partial<LineInput>) => {
    setLines((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }));
  };

  const resetLineToDefaults = (productId: number) => {
    const item = selectedPO?.items?.find((i) => i.productId === productId);
    if (!item) return;
    updateLine(productId, {
      uom: item.ordered_uom,
      factor: String(item.uom_conversion_factor),
      base: null,
      confirming: false,
      unlocked: false,
    });
  };

  const handleReset = () => {
    setSelectedPO(null);
    setLines({});
    setError(null);
    setSuccessInfo(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) setTimeout(handleReset, 200);
  };

  const rows = React.useMemo(() => {
    if (!selectedPO) return [];
    return (selectedPO.items ?? []).map((item) => {
      const line: LineInput = lines[item.productId] ?? {
        qty: "",
        uom: item.ordered_uom,
        factor: String(item.uom_conversion_factor),
        base: null,
        confirming: false,
        unlocked: false,
      };

      const qtyEmpty = line.qty.trim() === "";
      const qty = Number(line.qty);
      const factor = Number(line.factor);

      const qtyInvalid = qtyEmpty || !(Number.isFinite(qty) && qty > 0);
      const factorInvalid = !(Number.isFinite(factor) && factor > 0);
      const uomInvalid = line.uom.trim() === "";

      const computed =
        !qtyInvalid && !factorInvalid
          ? Math.round(qty * factor * 1000) / 1000
          : null;

      let base = computed;
      let baseInvalid = false;
      if (line.base !== null) {
        const b = Number(line.base);
        baseInvalid = line.base.trim() === "" || !(Number.isFinite(b) && b > 0);
        base = baseInvalid ? null : b;
      }

      const exceeds = base !== null && base > item.expected_base_quantity;

      return {
        item,
        line,
        qty,
        factor,
        base,
        computed,
        qtyEmpty,
        qtyInvalid,
        factorInvalid,
        uomInvalid,
        baseInvalid,
        exceeds,
        invalid:
          qtyInvalid || factorInvalid || uomInvalid || baseInvalid || exceeds,
      };
    });
  }, [selectedPO, lines]);

  const hasInvalid = rows.some((r) => r.invalid);
  const readyCount = rows.filter((r) => !r.invalid).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    if (hasInvalid) {
      setError("Please fix the highlighted fields before confirming.");
      return;
    }

    const payload: CreateDeliveryPayload = {
      poId: selectedPO.id,
      items: rows.map((r) =>
        r.line.unlocked
          ? {
              productId: r.item.productId,
              received_quantity: r.qty,
              received_uom: r.line.uom.trim(),
              uom_conversion_factor: r.factor,
              actual_base_quantity: r.base as number,
            }
          : {
              // Locked = PO defaults; backend fills UoM, factor and base qty
              productId: r.item.productId,
              received_quantity: r.qty,
            },
      ),
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createDelivery(payload);
      setSuccessInfo({
        message:
          res.message || "Delivery recorded successfully and stock updated.",
        isPartial: res.isPartial,
      });
      onSuccess?.();
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to record delivery. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (bad: boolean, locked = false) =>
    `h-9 font-mono tabular-nums text-sm rounded-md ${
      bad ? "border-destructive focus-visible:ring-destructive" : ""
    } ${locked ? "bg-muted/40 text-muted-foreground" : ""}`;

  const selectClass = (locked: boolean) =>
    `h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
      locked ? "bg-muted/40 text-muted-foreground" : ""
    }`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Receive Delivery
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-4xl w-full font-sans max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Process Stock Delivery Intake
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {selectedPO
              ? "Only the received quantity is required. UoM, conversion factor and base quantity are pre-filled from the Purchase Order."
              : "Choose the Purchase Order this delivery belongs to. Use the date range to narrow the list."}
          </DialogDescription>
        </DialogHeader>

        {successInfo && (
          <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{successInfo.message}</p>
              {successInfo.isPartial && (
                <p className="text-xs opacity-90">
                  PO was marked as partially fulfilled.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="break-words min-w-0">{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4"
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {!selectedPO ? (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 1: Select Purchase Order
                </h3>
                {loadingPO ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading purchase order...
                  </div>
                ) : (
                  <POSelectList onSelectPO={handleSelectPO} />
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border bg-muted/40">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base">
                        PO #{selectedPO.id}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-sm font-mono text-[11px]"
                      >
                        {selectedPO.po_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">
                      {selectedPO.supplierName ||
                        `Supplier #${selectedPO.supplierId}`}
                      {selectedPO.order_date
                        ? ` • Ordered ${new Date(selectedPO.order_date).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="rounded-md gap-1.5 text-xs h-9 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Change PO
                  </Button>
                </div>

                {rows.map((r) => {
                  const id = r.item.productId;
                  const locked = !r.line.unlocked;
                  const uomOptions = UOM_OPTIONS.includes(r.line.uom)
                    ? UOM_OPTIONS
                    : [r.line.uom, ...UOM_OPTIONS];

                  return (
                    <div
                      key={r.item.id ?? id}
                      className="rounded-lg border border-border bg-card p-4 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold break-words">
                            {r.item.productName}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">
                            {r.item.sku || "—"}
                          </p>
                        </div>

                        <dl className="grid grid-cols-3 gap-x-6 gap-y-1 shrink-0 text-right">
                          <div>
                            <dt className={labelClass}>Ordered</dt>
                            <dd className="font-mono text-sm tabular-nums whitespace-nowrap">
                              {r.item.requested_quantity.toLocaleString()}{" "}
                              {r.item.ordered_uom}
                            </dd>
                          </div>
                          <div>
                            <dt className={labelClass}>Unit cost</dt>
                            <dd className="font-mono text-sm tabular-nums whitespace-nowrap">
                              {formatPeso(r.item.unit_cost)}
                            </dd>
                          </div>
                          <div>
                            <dt className={labelClass}>
                              Expected in base unit
                            </dt>
                            <dd className="font-mono text-sm tabular-nums whitespace-nowrap">
                              {r.item.expected_base_quantity.toLocaleString()}{" "}
                              {r.item.base_uom}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Received qty: the only required input */}
                        <div className="space-y-1.5">
                          <label htmlFor={`qty-${id}`} className={labelClass}>
                            Received qty{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          <Input
                            id={`qty-${id}`}
                            type="number"
                            min="0"
                            step="any"
                            value={r.line.qty}
                            disabled={isSubmitting}
                            onChange={(e) =>
                              updateLine(id, {
                                qty: e.target.value,
                                base: null,
                              })
                            }
                            className={inputClass(r.qtyInvalid || r.exceeds)}
                          />
                          <p
                            className={`text-[11px] ${
                              r.qtyInvalid || r.exceeds
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {r.qtyEmpty
                              ? "Please enter a number. This cannot be empty."
                              : r.qtyInvalid
                                ? "Must be greater than 0"
                                : r.exceeds
                                  ? `Exceeds expected (max ${r.item.expected_base_quantity.toLocaleString()} ${r.item.base_uom})`
                                  : `Max ${r.item.requested_quantity.toLocaleString()} ${r.item.ordered_uom}`}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor={`uom-${id}`} className={labelClass}>
                            Received UoM
                          </label>
                          <select
                            id={`uom-${id}`}
                            value={r.line.uom}
                            disabled={isSubmitting || locked}
                            onChange={(e) =>
                              updateLine(id, { uom: e.target.value })
                            }
                            className={selectClass(locked)}
                          >
                            {uomOptions.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor={`factor-${id}`}
                            className={labelClass}
                          >
                            Conv. factor
                          </label>
                          <Input
                            id={`factor-${id}`}
                            type="number"
                            min="0"
                            step="any"
                            value={r.line.factor}
                            disabled={isSubmitting || locked}
                            onChange={(e) =>
                              updateLine(id, {
                                factor: e.target.value,
                                base: null,
                              })
                            }
                            className={inputClass(r.factorInvalid, locked)}
                          />
                          {r.factorInvalid && (
                            <p className="text-[11px] text-destructive">
                              Must be greater than 0
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor={`base-${id}`} className={labelClass}>
                            Actual base qty
                          </label>
                          {locked ? (
                            <div className="h-9 flex items-center rounded-md border border-dashed border-border bg-muted/40 px-3 font-mono tabular-nums text-sm font-semibold">
                              {r.base !== null
                                ? `${r.base.toLocaleString()} ${r.item.base_uom}`
                                : "—"}
                            </div>
                          ) : (
                            <>
                              <Input
                                id={`base-${id}`}
                                type="number"
                                min="0"
                                step="any"
                                value={
                                  r.line.base ??
                                  (r.computed !== null
                                    ? String(r.computed)
                                    : "")
                                }
                                disabled={isSubmitting}
                                onChange={(e) =>
                                  updateLine(id, { base: e.target.value })
                                }
                                className={inputClass(r.baseInvalid)}
                              />
                              {r.baseInvalid && (
                                <p className="text-[11px] text-destructive">
                                  Must be greater than 0
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit prompt for the locked fields */}
                      {locked && !r.line.confirming && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => updateLine(id, { confirming: true })}
                          className="h-8 text-xs gap-1.5 text-muted-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit UoM,
                          Conversion Factor, or Expected Base Qty.
                        </Button>
                      )}

                      {locked && r.line.confirming && (
                        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              These values come from the Purchase Order. Editing
                              them can make stock data inaccurate. Edit only if
                              the delivery really differs.
                            </span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() =>
                                updateLine(id, { confirming: false })
                              }
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() =>
                                updateLine(id, {
                                  confirming: false,
                                  unlocked: true,
                                })
                              }
                            >
                              Yes, edit
                            </Button>
                          </div>
                        </div>
                      )}

                      {!locked && (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> Custom
                            values: double-check before confirming.
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => resetLineToDefaults(id)}
                            className="h-8 text-xs gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset to PO
                            defaults
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center sm:justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-md text-xs h-9"
            >
              Cancel
            </Button>

            {selectedPO && (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground font-mono tabular-nums hidden sm:inline">
                  {readyCount} of {rows.length} items ready
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || hasInvalid}
                  className="rounded-md text-xs font-semibold uppercase tracking-wider gap-2 h-9"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording
                      Delivery...
                    </>
                  ) : (
                    <>
                      <PackagePlus className="h-4 w-4" /> Confirm & Update Stock
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
