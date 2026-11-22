// Expanded line-item panel of a purchase order row in the POS inventory module.
// Lists PO items and derives each item's receipt status from delivered base units (API has none).
// Rendered by PurchaseOrderTable only while a row is expanded.
"use client";

import * as React from "react";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchPurchaseOrderDetail,
  fetchReceivedBaseByProduct,
} from "@/lib/inventory/purchase-order-api";
import {
  PurchaseOrderDto,
  PurchaseOrderItemDto,
} from "@/lib/inventory/purchase-order-types";
import { formatPeso, getErrorMessage } from "@/lib/utils";

type ItemReceiptStatus = "PENDING" | "PARTIAL" | "COMPLETE" | "CANCELLED";

interface DeliveryResult {
  receivedByProduct: Record<number, number>;
  error: string | null;
}

interface DetailResult {
  order: PurchaseOrderDto | null;
  error: string | null;
}

const RECEIPT_STYLES: Record<ItemReceiptStatus, string> = {
  PENDING: "border-primary/30 bg-primary/5 text-primary",
  PARTIAL: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
};

// Derives an item's receipt status by comparing received base units with the expected base units.
function getItemReceiptStatus(
  received: number,
  expected: number,
  cancelled: boolean,
): ItemReceiptStatus {
  if (cancelled) return "CANCELLED";
  if (received <= 0) return "PENDING";
  return received >= expected ? "COMPLETE" : "PARTIAL";
}

interface PurchaseOrderItemsDetailProps {
  listOrder: PurchaseOrderDto;
}

// Renders the nested line-item manifest; loads fresh PO detail and delivery totals once when mounted.
export function PurchaseOrderItemsDetail({
  listOrder,
}: PurchaseOrderItemsDetailProps) {
  const [detail, setDetail] = React.useState<DetailResult | null>(null);
  const [result, setResult] = React.useState<DeliveryResult | null>(null);

  const order = detail?.order ?? listOrder;
  const cancelled = order.po_status === "CANCELLED";

  React.useEffect(() => {
    let active = true;

    fetchPurchaseOrderDetail(listOrder.id)
      .then((fresh) => {
        if (active) setDetail({ order: fresh, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setDetail({
            order: null,
            error: getErrorMessage(err, "Failed to load purchase order detail."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [listOrder.id]);

  React.useEffect(() => {
    if (listOrder.po_status === "CANCELLED") return;
    let active = true;

    fetchReceivedBaseByProduct(listOrder.id)
      .then((receivedByProduct) => {
        if (active) setResult({ receivedByProduct, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            receivedByProduct: {},
            error: getErrorMessage(err, "Failed to load delivery totals."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [listOrder.id, listOrder.po_status]);

  const loadingReceipts = !cancelled && result === null;
  const receiptsAvailable = cancelled || (result !== null && !result.error);

  const getReceived = (item: PurchaseOrderItemDto) =>
    result?.receivedByProduct[item.productId] ?? 0;

  return (
    <div className="bg-muted/35 border-t border-border/70 px-6 py-4 shadow-inner">
      {/* Subtle section header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          <Package className="h-3.5 w-3.5 text-primary" />
          <span>Line Items ({order.items.length})</span>
        </div>
      </div>

      {detail?.error && (
        <p className="mb-2 break-words rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {detail.error} Showing the data from the list instead.
        </p>
      )}

      {result?.error && (
        <p className="mb-2 break-words rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {result.error} Receipt status is unavailable for this order.
        </p>
      )}

      {order.items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-background/60 py-6 text-center text-xs text-muted-foreground">
          This purchase order has no line items.
        </p>
      ) : (
        <div className="divide-y divide-border/60 rounded-md border border-border/80 bg-background">
          {order.items.map((item) => {
            const received = getReceived(item);
            const expected = Number(item.expected_base_quantity);
            const status = getItemReceiptStatus(received, expected, cancelled);

            return (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/20 md:grid-cols-12 md:items-center"
              >
                {/* 1. Product Name & SKU (5 cols) */}
                <div className="md:col-span-5">
                  <div className="font-semibold text-foreground">
                    {item.productName}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {item.sku ?? "NO-SKU"}
                  </div>
                </div>

                {/* 2. Received vs Expected Quantity (3 cols) */}
                <div className="md:col-span-3">
                  <div className="font-mono tabular-nums text-foreground">
                    {receiptsAvailable ? (
                      <>
                        <span className="font-semibold">
                          {received.toLocaleString()}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          / {expected.toLocaleString()} {item.base_uom}
                        </span>
                      </>
                    ) : loadingReceipts ? (
                      <span className="text-muted-foreground">Checking…</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    Expected: {expected.toLocaleString()} {item.base_uom}
                    {Number(item.uom_conversion_factor) > 1 && (
                      <span>
                        {" "}
                        ({Number(item.requested_quantity).toLocaleString()}{" "}
                        {item.ordered_uom} ×{" "}
                        {Number(item.uom_conversion_factor).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Unit Cost & Line Total (2 cols) */}
                <div className="md:col-span-2 md:text-right">
                  <div className="font-mono font-semibold tabular-nums text-foreground">
                    {formatPeso(Number(item.total_cost))}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    @ {formatPeso(Number(item.unit_cost))} / {item.ordered_uom}
                  </div>
                </div>

                {/* 4. Status Badge Only (2 cols) */}
                <div className="flex items-center md:col-span-2 md:justify-end">
                  {receiptsAvailable ? (
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-[4px] font-mono text-[10px] font-semibold tracking-wider ${RECEIPT_STYLES[status]}`}
                    >
                      {status}
                    </Badge>
                  ) : loadingReceipts ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      Checking…
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}