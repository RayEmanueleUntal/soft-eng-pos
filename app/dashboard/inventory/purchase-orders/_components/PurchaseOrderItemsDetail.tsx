// Expanded line-item panel of a purchase order row in the POS inventory module.
// Lists PO items and derives each item's receipt status from delivered base units (API has none).
// Rendered by PurchaseOrderTable only while a row is expanded.
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchReceivedBaseByProduct } from "@/lib/inventory/purchase-order-api";
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

const RECEIPT_STYLES: Record<ItemReceiptStatus, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  PARTIAL: "border-primary/30 bg-primary/5 text-primary",
  COMPLETE: "border-transparent bg-primary text-primary-foreground",
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
  order: PurchaseOrderDto;
}

// Renders the nested line-item table and loads delivery totals once when mounted.
export function PurchaseOrderItemsDetail({
  order,
}: PurchaseOrderItemsDetailProps) {
  const cancelled = order.po_status === "CANCELLED";
  const [result, setResult] = React.useState<DeliveryResult | null>(null);

  React.useEffect(() => {
    if (cancelled) return;
    let active = true;

    // Totals received base units per product across every delivery recorded for this PO.
    fetchReceivedBaseByProduct(order.id)
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
  }, [order.id, cancelled]);

  const loadingReceipts = !cancelled && result === null;
  const receiptsAvailable = cancelled || (result !== null && !result.error);

  // Returns the received base quantity for one line item (0 when nothing was delivered).
  const getReceived = (item: PurchaseOrderItemDto) =>
    result?.receivedByProduct[item.productId] ?? 0;

  return (
    <div className="space-y-2 border-l-2 border-l-primary bg-muted/30 p-3">
      {result?.error && (
        <p className="break-words rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {result.error} Receipt status is unavailable for this order.
        </p>
      )}

      {order.items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          This purchase order has no line items.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-right">Expected (base)</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                <TableHead className="text-right">Received / Expected</TableHead>
                <TableHead className="text-right">Item status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const received = getReceived(item);
                const status = getItemReceiptStatus(
                  received,
                  item.expected_base_quantity,
                  cancelled,
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {item.sku ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span
                        className="block max-w-[260px] truncate"
                        title={item.productName}
                      >
                        {item.productName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {Number(item.requested_quantity).toLocaleString()}{" "}
                      {item.ordered_uom}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      ×{Number(item.uom_conversion_factor).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {Number(item.expected_base_quantity).toLocaleString()}{" "}
                      {item.base_uom}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatPeso(Number(item.unit_cost))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatPeso(Number(item.total_cost))}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {receiptsAvailable
                        ? `${received.toLocaleString()} / ${Number(
                            item.expected_base_quantity,
                          ).toLocaleString()}`
                        : loadingReceipts
                          ? "…"
                          : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {receiptsAvailable ? (
                        <Badge variant="outline" className={RECEIPT_STYLES[status]}>
                          {status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
