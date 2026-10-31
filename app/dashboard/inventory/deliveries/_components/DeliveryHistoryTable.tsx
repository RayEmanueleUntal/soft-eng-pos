"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryRecord } from "@/lib/inventory/delivery-types";
import { Eye, FileText, Calendar, Hash, ArrowUpDown } from "lucide-react";

interface DeliveryHistoryTableProps {
  deliveries: DeliveryRecord[];
  loading: boolean;
  onViewDetails: (deliveryId: number) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function DeliveryHistoryTable({
  deliveries,
  loading,
  onViewDetails,
  page,
  totalPages,
  total,
  onPageChange,
}: DeliveryHistoryTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
                Delivery ID
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
                PO Reference
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">
                Date & Time
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">
                Staff In-Charge
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">
                Line Items
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right font-mono">
                Total Units
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
                  colSpan={7}
                  className="text-center py-12 text-sm text-muted-foreground font-sans"
                >
                  Loading delivery history...
                </TableCell>
              </TableRow>
            ) : deliveries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-sm text-muted-foreground font-sans"
                >
                  No deliveries recorded yet. Use &quot;Receive Delivery&quot; to intake stock against open POs.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => {
                const totalUnits = delivery.deliveryItems.reduce(
                  (sum, item) => sum + (item.received_quantity || 0),
                  0,
                );

                return (
                  <TableRow
                    key={delivery.id}
                    className="hover:bg-accent/40 transition-colors cursor-pointer text-xs"
                    onClick={() => onViewDetails(delivery.id)}
                  >
                    <TableCell className="font-mono font-bold text-foreground">
                      #{delivery.id}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono font-medium rounded-sm border-primary/30 text-primary bg-primary/5"
                      >
                        PO #{delivery.poId}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground font-sans">
                      {new Date(delivery.delivery_date).toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="font-medium text-foreground font-sans">
                      {delivery.staffName || `Staff ID #${delivery.staffId}`}
                    </TableCell>

                    <TableCell className="text-center font-mono">
                      {delivery.deliveryItems.length}
                    </TableCell>

                    <TableCell className="text-right font-mono font-semibold text-foreground tabular-nums">
                      {totalUnits.toLocaleString()}
                    </TableCell>

                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(delivery.id)}
                        className="h-8 gap-1 rounded-md text-xs font-sans hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <div>
          Showing {deliveries.length} of {total} records (Page {page} of{" "}
          {Math.max(totalPages, 1)})
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-md h-8 text-xs font-sans"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-md h-8 text-xs font-sans"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

