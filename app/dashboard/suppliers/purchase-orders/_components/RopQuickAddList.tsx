// Low-stock quick-add panel for the Create Purchase Order form in the POS inventory module.
// Loads items at or below their reorder point (GET /inventory/rop) and adds them to the draft.
// Used only by CreatePurchaseOrderForm.
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { fetchROPItems } from "@/lib/inventory/stock-rop-api";
import { InventoryItem } from "@/lib/inventory/types";
import { getErrorMessage } from "@/lib/utils";

interface RopResult {
  items: InventoryItem[];
  error: string | null;
}

interface RopQuickAddListProps {
  addedProductIds: Set<number>;
  disabled: boolean;
  onAdd: (item: InventoryItem) => void;
  onAddAll: (items: InventoryItem[]) => void;
}

// Renders the below-ROP products with per-row Add and an Add all button.
export function RopQuickAddList({
  addedProductIds,
  disabled,
  onAdd,
  onAddAll,
}: RopQuickAddListProps) {
  const [result, setResult] = React.useState<RopResult | null>(null);

  React.useEffect(() => {
    let active = true;

    fetchROPItems()
      .then((items) => {
        if (active) setResult({ items, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            items: [],
            error: getErrorMessage(err, "Failed to load low-stock items."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const items = result?.items ?? [];
  const pending = items.filter((item) => !addedProductIds.has(item.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Below reorder point
        </h4>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled || pending.length === 0}
          onClick={() => onAddAll(pending)}
        >
          Add all ({pending.length})
        </Button>
      </div>

      <div className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
        {result === null ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            Loading low-stock items...
          </p>
        ) : result.error ? (
          <p className="break-words p-4 text-center text-xs text-destructive">
            {result.error}
          </p>
        ) : items.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            All stock levels are healthy.
          </p>
        ) : (
          items.map((item) => {
            const added = addedProductIds.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground" title={item.name}>
                    {item.name}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.sku ?? "—"} ·{" "}
                    <span className="text-destructive">
                      {item.current_quantity} / {item.reorder_point_ROP}
                    </span>{" "}
                    {item.base_uom}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={added ? "ghost" : "outline"}
                  size="xs"
                  disabled={disabled || added}
                  onClick={() => onAdd(item)}
                >
                  {added ? "Added" : "Add"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
