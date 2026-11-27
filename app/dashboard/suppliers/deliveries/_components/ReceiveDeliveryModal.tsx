"use client";

import * as React from "react";
import { FormModal } from "@/components/shared/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PurchaseOrder,
  CreateDeliveryPayload,
} from "@/lib/inventory/delivery-types";
import {
  createDelivery,
  fetchDeliveries,
  fetchPurchaseOrderById,
} from "@/lib/inventory/delivery-api";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { POSelectList } from "./POSelectList";
import {
  PackagePlus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Pencil,
  RotateCcw,
  Truck,
  Plus,
} from "lucide-react";

interface ReceiveDeliveryModalProps {
  onSuccess?: (info: { message: string; isPartial: boolean }) => void;
  trigger?: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
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
  "SMALL_BOX",
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

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const formatQty = (n: number) =>
  round3(n).toLocaleString(undefined, { maximumFractionDigits: 3 });

export function ReceiveDeliveryModal({
  onSuccess,
  trigger,
}: ReceiveDeliveryModalProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(
    null,
  );
  // Maps productId -> total actual_base_quantity already accepted in prior deliveries
  const [receivedBaseMap, setReceivedBaseMap] = React.useState<
    Record<number, number>
  >({});
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
      const [full, deliveriesRes] = await Promise.all([
        fetchPurchaseOrderById(po.id),
        fetchDeliveries({ poId: po.id, limit: 100 }),
      ]);

      // Sum previously accepted base quantities per productId across all prior deliveries for this PO
      const priorBaseByProduct: Record<number, number> = {};
      for (const record of deliveriesRes.data ?? []) {
        for (const dItem of record.deliveryItems ?? []) {
          priorBaseByProduct[dItem.productId] = round3(
            (priorBaseByProduct[dItem.productId] ?? 0) +
              Number(dItem.actual_base_quantity || 0),
          );
        }
      }

      const initial: Record<number, LineInput> = {};
      (full.items ?? []).forEach((item) => {
        const alreadyBase = priorBaseByProduct[item.productId] ?? 0;
        const remainingBase = Math.max(
          0,
          round3(item.expected_base_quantity - alreadyBase),
        );
        const factor = item.uom_conversion_factor || 1;
        const remainingOrderedQty =
          remainingBase > 0 ? round3(remainingBase / factor) : 0;

        initial[item.productId] = {
          qty: remainingOrderedQty > 0 ? String(remainingOrderedQty) : "0",
          uom: item.ordered_uom,
          factor: String(item.uom_conversion_factor),
          base: null,
          confirming: false,
          unlocked: false,
        };
      });

      setReceivedBaseMap(priorBaseByProduct);
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
    setReceivedBaseMap({});
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
      const alreadyReceivedBase = receivedBaseMap[item.productId] ?? 0;
      const remainingBase = Math.max(
        0,
        round3(item.expected_base_quantity - alreadyReceivedBase),
      );
      const isFulfilled = remainingBase <= 0;

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

      // Allow 0 on unfulfilled rows so partial deliveries can skip items not present in this shipment
      const qtyInvalid =
        !isFulfilled && (qtyEmpty || !(Number.isFinite(qty) && qty >= 0));
      const isSkippedThisDelivery = !isFulfilled && !qtyInvalid && qty === 0;

      const factorInvalid =
        !isFulfilled &&
        !isSkippedThisDelivery &&
        !(Number.isFinite(factor) && factor > 0);
      const uomInvalid =
        !isFulfilled && !isSkippedThisDelivery && line.uom.trim() === "";

      const activeFactor =
        Number.isFinite(factor) && factor > 0
          ? factor
          : item.uom_conversion_factor || 1;
      const remainingInSelectedUom = round3(remainingBase / activeFactor);

      const computed =
        !qtyInvalid && !factorInvalid ? round3(qty * factor) : null;

      let base = computed;
      let baseInvalid = false;
      if (!isFulfilled && !isSkippedThisDelivery && line.base !== null) {
        const b = Number(line.base);
        baseInvalid =
          line.base.trim() === "" || !(Number.isFinite(b) && b > 0);
        base = baseInvalid ? null : b;
      }

      // Compare incoming base qty against the REMAINING base qty (no cap limit)
      const exceeds =
        !isFulfilled &&
        !isSkippedThisDelivery &&
        base !== null &&
        base > remainingBase;

      return {
        item,
        line,
        alreadyReceivedBase,
        remainingBase,
        remainingInSelectedUom,
        isFulfilled,
        isSkippedThisDelivery,
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
          !isFulfilled &&
          (qtyInvalid || factorInvalid || uomInvalid || baseInvalid),
      };
    });
  }, [selectedPO, lines, receivedBaseMap]);

  const activeRows = rows.filter((r) => !r.isFulfilled);
  const submittableRows = activeRows.filter((r) => !r.isSkippedThisDelivery);
  const allFulfilled = rows.length > 0 && activeRows.length === 0;
  const hasInvalid = activeRows.some((r) => r.invalid);
  const hasNothingToSubmit = !allFulfilled && submittableRows.length === 0;
  const readyCount = submittableRows.filter((r) => !r.invalid).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || allFulfilled) return;

    if (hasInvalid) {
      setError("Please fix the highlighted fields before confirming.");
      return;
    }

    if (submittableRows.length === 0) {
      setError(
        "Enter a received quantity greater than 0 for at least one item.",
      );
      return;
    }

    // Only submit unfulfilled items with qty > 0
    const payload: CreateDeliveryPayload = {
      poId: selectedPO.id,
      items: submittableRows.map((r) =>
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
      const message =
        res.message || "Delivery recorded successfully and stock updated.";

      onSuccess?.({
        message,
        isPartial: res.isPartial,
      });
      handleOpenChange(false);
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
    <>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: () => handleOpenChange(true),
        })
      ) : (
        <Button
          onClick={() => handleOpenChange(true)}
          className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Receive Delivery
        </Button>
      )}

      <FormModal
        open={open}
        onOpenChange={handleOpenChange}
        title={
          <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Truck className="h-5 w-5 text-primary" />
            Process Stock Delivery Intake
          </span>
        }
        description={
          selectedPO
            ? "Remaining quantities are pre-filled based on prior deliveries. Set an item to 0 if it wasn't included in this shipment."
            : "Choose the Purchase Order this delivery belongs to. Use the date range to narrow the list."
        }
        size="xl"
        className="sm:max-w-4xl w-full font-sans max-h-[90vh] flex flex-col gap-4"
      >

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

                {allFulfilled && (
                  <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      All line items on this Purchase Order have already been
                      fully received.
                    </span>
                  </div>
                )}

                {rows.map((r) => {
                  const id = r.item.productId;
                  const locked =
                    r.isFulfilled ||
                    r.isSkippedThisDelivery ||
                    !r.line.unlocked;
                  const uomOptions = UOM_OPTIONS.includes(r.line.uom)
                    ? UOM_OPTIONS
                    : [r.line.uom, ...UOM_OPTIONS];
                  const activeUomLabel = r.line.uom.trim() || r.item.ordered_uom;

                  return (
                    <div
                      key={r.item.id ?? id}
                      className={`rounded-lg border p-4 space-y-4 transition-opacity ${
                        r.isFulfilled
                          ? "border-border/60 bg-muted/30 opacity-75"
                          : r.isSkippedThisDelivery
                            ? "border-dashed border-border bg-muted/20"
                            : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold break-words">
                              {r.item.productName}
                            </p>
                            {r.isFulfilled ? (
                              <Badge className="rounded-sm bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/15 font-mono text-[10px] uppercase tracking-wider">
                                Fulfilled
                              </Badge>
                            ) : r.alreadyReceivedBase > 0 ? (
                              <Badge
                                variant="outline"
                                className="rounded-sm border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] uppercase tracking-wider"
                              >
                                Partial • {formatQty(r.remainingBase)}{" "}
                                {r.item.base_uom} left
                              </Badge>
                            ) : null}
                            {r.isSkippedThisDelivery && (
                              <Badge
                                variant="secondary"
                                className="rounded-sm font-mono text-[10px] uppercase tracking-wider"
                              >
                                Not in this delivery
                              </Badge>
                            )}
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {r.item.sku || "—"}
                          </p>
                        </div>

                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 shrink-0 text-right">
                          <div>
                            <dt className={labelClass}>Ordered</dt>
                            <dd className="font-mono text-sm tabular-nums whitespace-nowrap">
                              {formatQty(r.item.requested_quantity)}{" "}
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
                            <dt className={labelClass}>Accepted</dt>
                            <dd
                              className={`font-mono text-sm tabular-nums whitespace-nowrap font-medium ${
                                r.isFulfilled
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : r.alreadyReceivedBase > 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {formatQty(r.alreadyReceivedBase)} /{" "}
                              {formatQty(r.item.expected_base_quantity)}{" "}
                              {r.item.base_uom}
                            </dd>
                          </div>
                          <div>
                            <dt className={labelClass}>Remaining</dt>
                            <dd className="font-mono text-sm tabular-nums whitespace-nowrap font-semibold">
                              {formatQty(r.remainingBase)} {r.item.base_uom}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Received qty */}
                        <div className="space-y-1.5">
                          <label htmlFor={`qty-${id}`} className={labelClass}>
                            Received qty{" "}
                            {!r.isFulfilled && (
                              <span className="text-destructive">*</span>
                            )}
                          </label>
                          <Input
                            id={`qty-${id}`}
                            type="number"
                            min="0"
                            step="any"
                            value={r.isFulfilled ? "0" : r.line.qty}
                            disabled={isSubmitting || r.isFulfilled}
                            onChange={(e) =>
                              updateLine(id, {
                                qty: e.target.value,
                                base: null,
                              })
                            }
                            className={inputClass(r.qtyInvalid, r.isFulfilled)}
                          />
                          <p
                            className={`text-[11px] ${
                              r.isFulfilled
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : r.qtyInvalid
                                  ? "text-destructive"
                                  : r.exceeds
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : "text-muted-foreground"
                            }`}
                          >
                            {r.isFulfilled ? (
                              `All ${formatQty(r.item.expected_base_quantity)} ${r.item.base_uom} received`
                            ) : r.qtyEmpty ? (
                              "Please enter a number (0 to skip)."
                            ) : r.qtyInvalid ? (
                              "Must be 0 or greater"
                            ) : r.isSkippedThisDelivery ? (
                              `Skipped (${formatQty(r.remainingInSelectedUom)} ${activeUomLabel} still pending)`
                            ) : r.exceeds && r.base !== null ? (
                              <span>
                                Exceeded remaining by{" "}
                                {formatQty(r.base - r.remainingBase)}{" "}
                                {r.item.base_uom}
                              </span>
                            ) : (
                              `Remaining ${formatQty(r.remainingInSelectedUom)} ${activeUomLabel}`
                            )}
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
                            <div className="h-9 flex items-center rounded-md border border-dashed border-border bg-muted/40 px-3 font-mono tabular-nums text-sm font-semibold text-muted-foreground">
                              {r.isFulfilled || r.isSkippedThisDelivery
                                ? `0 ${r.item.base_uom}`
                                : r.base !== null
                                  ? `${formatQty(r.base)} ${r.item.base_uom}`
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

                      {/* Edit prompt for unfulfilled, non-skipped locked fields */}
                      {!r.isFulfilled &&
                        !r.isSkippedThisDelivery &&
                        locked &&
                        !r.line.confirming && (
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

                      {!r.isFulfilled &&
                        !r.isSkippedThisDelivery &&
                        locked &&
                        r.line.confirming && (
                          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              <span>
                                These values come from the Purchase Order.
                                Editing them can make stock data inaccurate.
                                Edit only if the delivery really differs.
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

                      {!r.isFulfilled && !r.isSkippedThisDelivery && !locked && (
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

          <div className="pt-4 border-t border-border flex items-center sm:justify-between gap-3">
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
                  {allFulfilled
                    ? "All items fulfilled"
                    : hasNothingToSubmit
                      ? "At least 1 item must have qty > 0"
                      : `${readyCount} of ${activeRows.length} remaining item${activeRows.length === 1 ? "" : "s"} in this delivery`}
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSubmitting ||
                    hasInvalid ||
                    allFulfilled ||
                    hasNothingToSubmit
                  }
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
          </div>
        </form>
      </FormModal>
    </>
  );
}