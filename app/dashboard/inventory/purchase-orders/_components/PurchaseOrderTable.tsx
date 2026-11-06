// Paginated, expandable purchase orders table for the POS inventory module.
// Each row expands to show line items and receipt status; PENDING rows offer a Cancel action.
// Used only by the /dashboard/inventory/purchase-orders page.
"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PurchaseOrderDto } from "@/lib/inventory/purchase-order-types";
import { formatPeso } from "@/lib/utils";
import { PurchaseOrderItemsDetail } from "./PurchaseOrderItemsDetail";
import { PurchaseOrderStatusBadge } from "./PurchaseOrderStatusBadge";

const COLUMN_COUNT = 9;

interface PurchaseOrderTableProps {
  orders: PurchaseOrderDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  canCancel: boolean;
  onPageChange: (page: number) => void;
  onCancelRequest: (order: PurchaseOrderDto) => void;
}

// Renders the PO list with expandable rows and pagination controls.
export function PurchaseOrderTable({
  orders,
  loading,
  page,
  totalPages,
  total,
  canCancel,
  onPageChange,
  onCancelRequest,
}: PurchaseOrderTableProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());

  // Expands or collapses one row; several rows may stay open at once.
  const toggleRow = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Grand total</TableHead>
              <TableHead>Order date</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Loading purchase orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No purchase orders found. Use &quot;New Purchase Order&quot; to
                  create one.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const expanded = expandedIds.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                    <TableRow
                      className="cursor-pointer text-xs"
                      onClick={() => toggleRow(order.id)}
                    >
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-expanded={expanded}
                          aria-label={
                            expanded
                              ? `Collapse PO #${order.id}`
                              : `Expand PO #${order.id}`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(order.id);
                          }}
                        >
                          {expanded ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-foreground">
                        #{order.id}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span
                          className="block max-w-[220px] truncate"
                          title={order.supplierName}
                        >
                          {order.supplierName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PurchaseOrderStatusBadge status={order.po_status} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {order.items.length}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                        {formatPeso(Number(order.grand_total))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.order_date).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className="block max-w-[160px] truncate"
                          title={order.createdByName}
                        >
                          {order.createdByName}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canCancel && order.po_status === "PENDING" ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancelRequest(order)}
                          >
                            <XCircle /> Cancel PO
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMN_COUNT} className="p-0">
                          <PurchaseOrderItemsDetail listOrder={order} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <div>
          Showing {orders.length} of {total} records (Page {page} of{" "}
          {Math.max(totalPages, 1)})
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="font-sans"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="font-sans"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
