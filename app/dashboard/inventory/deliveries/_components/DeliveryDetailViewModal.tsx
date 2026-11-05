"use client";
import { getErrorMessage } from "@/lib/utils";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliveryRecord } from "@/lib/inventory/delivery-types";
import { fetchDeliveryById } from "@/lib/inventory/delivery-api";
import {
  Loader2,
  PackageCheck,
  Printer,
  Calendar,
  User,
  FileText,
} from "lucide-react";

interface DeliveryDetailViewModalProps {
  deliveryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryDetailViewModal({
  deliveryId,
  open,
  onOpenChange,
}: DeliveryDetailViewModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [record, setRecord] = React.useState<DeliveryRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !deliveryId) {
      setRecord(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDeliveryById(deliveryId)
      .then((data) => {
        if (!cancelled) {
          setRecord(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              `Delivery record #${deliveryId} could not be retrieved.`,
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, deliveryId]);

  const handlePrint = () => {
    window.print();
  };

  const totalItemsCount =
    record?.deliveryItems.reduce(
      (acc, item) => acc + item.actual_base_quantity,
      0,
    ) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full font-sans">
        {" "}
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Delivery Receipt #{deliveryId}
            </DialogTitle>
          </div>
        </DialogHeader>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading receipt details...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive bg-destructive/10 rounded-md p-4">
            {error}
          </div>
        ) : record ? (
          <div className="space-y-4">
            {/* Meta summary card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-lg border border-border text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Purchase Order
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    PO #{record.poId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Received Date
                  </span>
                  <span className="font-mono text-foreground">
                    {new Date(record.delivery_date).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Staff In-Charge
                  </span>
                  <span className="font-medium text-foreground">
                    {record.staffName || `Staff ID #${record.staffId}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Product
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider font-mono">
                      SKU
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right font-mono">
                      Received
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right font-mono">
                      Conv. Factor
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right font-mono">
                      Base Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.deliveryItems.map((item) => (
                    <TableRow key={item.id} className="text-xs">
                      <TableCell className="font-medium text-foreground break-words max-w-[220px]">
                        {item.productName}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {item.productSku || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                        {item.received_quantity.toLocaleString()}{" "}
                        {item.received_uom}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                        × {item.uom_conversion_factor.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        {item.actual_base_quantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/20 font-medium">
                    <TableCell colSpan={4} className="text-right text-xs">
                      Total Base Units Received:
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground text-sm tabular-nums">
                      {totalItemsCount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
        <DialogFooter className="flex justify-between sm:justify-between items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!record}
            className="rounded-md gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-md text-xs font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
