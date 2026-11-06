// Create Purchase Order form for the POS inventory module's Purchase Orders subpage.
// Combines a searchable supplier picker, ROP quick-add, product search and an editable draft, then POSTs it.
// Mounted inside CreatePurchaseOrderModal, so its state resets whenever the dialog closes.
"use client";

import * as React from "react";
import { AlertCircle, Loader2, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createPurchaseOrder } from "@/lib/inventory/purchase-order-api";
import { PurchaseOrderDto } from "@/lib/inventory/purchase-order-types";
import { InventoryItem } from "@/lib/inventory/types";
import { fetchSupplierById, fetchSuppliers, Supplier } from "@/lib/suppliers/suppliers";
import { getErrorMessage } from "@/lib/utils";
import {
  createDraftLine,
  DraftLine,
  getSelectedUom,
  isValidFactor,
  isValidQuantity,
  isValidUnitCost,
  PoLineItemsEditor,
} from "./PoLineItemsEditor";
import { PoProductSearch } from "./PoProductSearch";
import { RopQuickAddList } from "./RopQuickAddList";
import { SupplierDetailResult, SupplierInfoPanel } from "./SupplierInfoPanel";
import { SupplierSearchSelect } from "./SupplierSearchSelect";

interface SupplierResult {
  suppliers: Supplier[];
  error: string | null;
}

interface CreatePurchaseOrderFormProps {
  onCancel: () => void;
  onCreated: (order: PurchaseOrderDto) => void;
}

// Renders the full create-PO form and submits it to POST /purchase-orders.
export function CreatePurchaseOrderForm({
  onCancel,
  onCreated,
}: CreatePurchaseOrderFormProps) {
  const [supplierResult, setSupplierResult] = React.useState<SupplierResult | null>(null);
  const [supplierId, setSupplierId] = React.useState("");
  const [supplierDetail, setSupplierDetail] = React.useState<SupplierDetailResult | null>(null);
  const [lines, setLines] = React.useState<DraftLine[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    fetchSuppliers({ status: "ACTIVE", limit: 100 })
      .then((response) => {
        if (active) setSupplierResult({ suppliers: response.data, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setSupplierResult({
            suppliers: [],
            error: getErrorMessage(err, "Failed to load suppliers."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (supplierId === "") return;
    let active = true;

    // Loads the picked supplier (GET /suppliers/{id}) to show its details and confirm it is active.
    fetchSupplierById(supplierId)
      .then((supplier) => {
        if (active) setSupplierDetail({ supplierId, supplier, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setSupplierDetail({
            supplierId,
            supplier: null,
            error: getErrorMessage(err, "Failed to load supplier details."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [supplierId]);

  const addedProductIds = React.useMemo(
    () => new Set(lines.map((line) => line.productId)),
    [lines],
  );

  // Adds products to the draft, skipping any already present.
  const addItems = (items: InventoryItem[], getQuantity: (item: InventoryItem) => number) => {
    setLines((prev) => {
      const existing = new Set(prev.map((line) => line.productId));
      const additions = items
        .filter((item) => !existing.has(item.id))
        .map((item) => createDraftLine(item, getQuantity(item)));
      return [...prev, ...additions];
    });
  };

  // Suggests an order quantity that tops a low-stock item back up to its reorder point.
  const suggestRopQuantity = (item: InventoryItem) =>
    Math.max(Number(item.reorder_point_ROP) - Number(item.current_quantity), 1);

  // Updates one field of a draft line.
  const updateLine = (productId: number, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line)),
    );
  };

  const suppliers = supplierResult?.suppliers ?? [];
  const linesValid =
    lines.length > 0 &&
    lines.every(
      (line) =>
        isValidQuantity(line.quantity) &&
        isValidUnitCost(line.unitCost) &&
        isValidFactor(line.factorOverride),
    );
  const currentSupplierDetail =
    supplierId !== "" && supplierDetail?.supplierId === supplierId ? supplierDetail : null;
  const supplierInactive = currentSupplierDetail?.supplier?.status === "INACTIVE";
  const canSubmit = supplierId !== "" && !supplierInactive && linesValid && !submitting;

  // Validates the draft and posts it; keeps the user's input when the request fails.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const order = await createPurchaseOrder({
        supplierId: Number(supplierId),
        items: lines.map((line) => {
          const selectedUom = getSelectedUom(line);
          return {
            productId: line.productId,
            requested_quantity: Number(line.quantity),
            ordered_uom: selectedUom.uom,
            ...(line.factorOverride.trim() !== ""
              ? { uom_conversion_factor: Number(line.factorOverride) }
              : {}),
            ...(line.unitCost.trim() !== "" ? { unit_cost: Number(line.unitCost) } : {}),
          };
        }),
      });
      onCreated(order);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create the purchase order."));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Supplier
          </label>
          {supplierResult === null ? (
            <p className="text-xs text-muted-foreground">Loading active suppliers...</p>
          ) : supplierResult.error ? (
            <p className="break-words text-xs text-destructive">{supplierResult.error}</p>
          ) : suppliers.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active suppliers found.{" "}
              <Link href="/dashboard/suppliers" className="text-primary underline">
                Manage suppliers
              </Link>
            </p>
          ) : (
            <SupplierSearchSelect
              suppliers={suppliers}
              value={supplierId}
              disabled={submitting}
              onChange={setSupplierId}
            />
          )}
          {supplierId !== "" && (
            <SupplierInfoPanel
              loading={currentSupplierDetail === null}
              result={currentSupplierDetail}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <RopQuickAddList
            addedProductIds={addedProductIds}
            disabled={submitting}
            onAdd={(item) => addItems([item], suggestRopQuantity)}
            onAddAll={(items) => addItems(items, suggestRopQuantity)}
          />
          <PoProductSearch
            addedProductIds={addedProductIds}
            disabled={submitting}
            onAdd={(item) => addItems([item], () => 1)}
          />
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Line items ({lines.length})
          </h4>
          <PoLineItemsEditor
            lines={lines}
            disabled={submitting}
            onUomChange={(id, uom) =>
              updateLine(id, { uom, unitCost: "", factorOverride: "", factorUnlocked: false })
            }
            onFactorUnlock={(id) => updateLine(id, { factorUnlocked: true })}
            onFactorOverrideChange={(id, value) => updateLine(id, { factorOverride: value })}
            onFactorOverrideReset={(id) =>
              updateLine(id, { factorOverride: "", factorUnlocked: false })
            }
            onQuantityChange={(id, value) => updateLine(id, { quantity: value })}
            onUnitCostChange={(id, value) => updateLine(id, { unitCost: value })}
            onRemove={(id) => setLines((prev) => prev.filter((l) => l.productId !== id))}
          />
          <p className="text-[11px] text-muted-foreground">
            Qty is in the selected unit. Leave cost and factor empty to use the product defaults.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit} className="gap-2 font-semibold uppercase">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <PackagePlus className="h-4 w-4" /> Create PO
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
