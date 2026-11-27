// Table of shipments for the shipments page.
// Shows invoice, customer, forwarder, waybill, status and timestamps, with row actions.
// Header count and pagination live in the page-level DataTableShell.
// Status updates are offered only for non-delivered shipments and only to roles allowed to change them.
"use client";

import * as React from "react";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShipmentStatusBadge } from "@/components/inventory/ShipmentStatusBadge";
import { Shipment } from "@/lib/inventory/shipment-types";
import { formatDateTime, getNextStatus } from "@/lib/inventory/shipment-utils";

interface ShipmentTableProps {
  shipments: Shipment[];
  loading: boolean;
  emptyMessage: string;
  canUpdate: boolean;
  onView: (shipment: Shipment) => void;
  onUpdateStatus: (shipment: Shipment) => void;
}

export function ShipmentTable({
  shipments,
  loading,
  emptyMessage,
  canUpdate,
  onView,
  onUpdateStatus,
}: ShipmentTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            ID
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold">
            Invoice
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold">
            Customer
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold">
            Forwarder
          </TableHead>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            Tracking No.
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold">
            Status
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold">
            Dispatched
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center py-12 text-sm text-muted-foreground font-sans"
            >
              Loading shipments...
            </TableCell>
          </TableRow>
        ) : shipments.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center py-12 text-sm text-muted-foreground font-sans"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          shipments.map((shipment) => {
            const nextStatus = getNextStatus(shipment.tracking_status);
            const invoice =
              shipment.transaction?.invoice_number ??
              `Order #${shipment.transactionId}`;

            return (
              <TableRow
                key={shipment.id}
                className="hover:bg-accent/40 transition-colors cursor-pointer text-xs"
                onClick={() => onView(shipment)}
              >
                <TableCell className="font-mono font-bold text-foreground">
                  #{shipment.id}
                </TableCell>

                <TableCell className="max-w-[140px] font-mono tabular-nums">
                  <span className="block truncate" title={invoice}>
                    {invoice}
                  </span>
                </TableCell>

                <TableCell className="max-w-[180px] font-sans">
                  <span
                    className="block truncate"
                    title={shipment.transaction?.customer_name ?? ""}
                  >
                    {shipment.transaction?.customer_name || "-"}
                  </span>
                </TableCell>

                <TableCell className="max-w-[160px] font-sans font-medium text-foreground">
                  <span
                    className="block truncate"
                    title={shipment.forwarder?.company_name ?? ""}
                  >
                    {shipment.forwarder?.company_name ?? "-"}
                  </span>
                </TableCell>

                <TableCell className="max-w-[180px] font-mono tabular-nums">
                  <span
                    className="block truncate"
                    title={shipment.tracking_number ?? ""}
                  >
                    {shipment.tracking_number || "-"}
                  </span>
                </TableCell>

                <TableCell>
                  <ShipmentStatusBadge status={shipment.tracking_status} />
                </TableCell>

                <TableCell className="text-muted-foreground font-sans whitespace-nowrap">
                  {formatDateTime(shipment.dispatch_date)}
                </TableCell>

                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(shipment)}
                      className="h-8 gap-1 rounded-md text-xs font-sans hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      View
                    </Button>
                    {canUpdate && nextStatus && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateStatus(shipment)}
                        className="h-8 gap-1 rounded-md text-xs font-sans border-primary/30 text-primary hover:bg-primary/5"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Update
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
