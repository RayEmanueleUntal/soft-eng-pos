// Table of shipments for the Active and History tabs of the shipments subpage.
// Shows invoice, customer, forwarder, waybill, status and timestamps, with pagination controls.
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
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { Shipment } from "@/lib/inventory/shipment-types";
import { formatDateTime, getNextStatus } from "@/lib/inventory/shipment-utils";
import { TablePagination } from "@/components/ui/table-pagination";

interface ShipmentTableProps {
  shipments: Shipment[];
  loading: boolean;
  emptyMessage: string;
  canUpdate: boolean;
  onView: (shipment: Shipment) => void;
  onUpdateStatus: (shipment: Shipment) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const HEAD_CLASS = "";

export function ShipmentTable({
  shipments,
  loading,
  emptyMessage,
  canUpdate,
  onView,
  onUpdateStatus,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: ShipmentTableProps) {
  return (
    <div className="space-y-4">
      {/*info subheading*/}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Outgoing Shipment History
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {total}
        </span>
      </div>

      {/*actual table*/}
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className={`${HEAD_CLASS} font-mono`}>ID</TableHead>
              <TableHead className={HEAD_CLASS}>Invoice</TableHead>
              <TableHead className={HEAD_CLASS}>Customer</TableHead>
              <TableHead className={HEAD_CLASS}>Forwarder</TableHead>
              <TableHead className={`${HEAD_CLASS} font-mono`}>
                Tracking No.
              </TableHead>
              <TableHead className={HEAD_CLASS}>Status</TableHead>
              <TableHead className={HEAD_CLASS}>Dispatched</TableHead>
              <TableHead className={HEAD_CLASS}>Last Updated</TableHead>
              <TableHead className={`${HEAD_CLASS} text-center`}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-sm text-muted-foreground font-sans"
                >
                  Loading shipments...
                </TableCell>
              </TableRow>
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
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

                    <TableCell className="font-mono tabular-nums whitespace-nowrap">
                      {invoice}
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

                    <TableCell className="text-muted-foreground font-sans whitespace-nowrap">
                      {formatDateTime(shipment.updatedAt)}
                    </TableCell>

                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
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
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="shipments"
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}