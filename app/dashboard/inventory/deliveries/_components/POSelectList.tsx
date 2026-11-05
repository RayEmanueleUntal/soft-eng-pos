"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PurchaseOrder } from "@/lib/inventory/delivery-types";
import { fetchPurchaseOrders } from "@/lib/inventory/delivery-api";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { Loader2, ArrowRight, RefreshCw, X } from "lucide-react";

// Statuses that can no longer receive stock
const CLOSED_STATUSES = ["FULFILLED", "CANCELLED"];

interface POSelectListProps {
  onSelectPO: (po: PurchaseOrder) => void;
}

export function POSelectList({ onSelectPO }: POSelectListProps) {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const rangeInvalid = !!startDate && !!endDate && startDate > endDate;

  const load = React.useCallback(async () => {
    if (rangeInvalid) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPurchaseOrders({
        page: 1,
        limit: 50,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(
        (res.data ?? []).filter((po) => !CLOSED_STATUSES.includes(po.po_status)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load purchase orders."));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, rangeInvalid]);

  React.useEffect(() => {
    load();
  }, [load]);

  const hasFilter = !!startDate || !!endDate;

  return (
    <div className="space-y-4 font-sans">
      {/* Date range filter */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="space-y-1.5 flex-1">
          <label
            htmlFor="po-start-date"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            From
          </label>
          <Input
            id="po-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-sm font-mono"
          />
        </div>
        <div className="space-y-1.5 flex-1">
          <label
            htmlFor="po-end-date"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            To
          </label>
          <Input
            id="po-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-sm font-mono"
          />
        </div>
        <div className="flex gap-2">
          {hasFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="h-9 text-xs gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {rangeInvalid && (
        <p className="text-xs text-destructive">
          The start date must be on or before the end date.
        </p>
      )}

      {/* PO list */}
      <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border divide-y divide-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading purchase orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive break-words">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No open Purchase Orders found
            {hasFilter ? " for this date range." : "."}
          </div>
        ) : (
          orders.map((po) => (
            <button
              key={po.id}
              type="button"
              onClick={() => onSelectPO(po)}
              className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-accent/40 transition-colors"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm">PO #{po.id}</span>
                  <Badge
                    variant="outline"
                    className="rounded-sm font-mono text-[11px] uppercase"
                  >
                    {po.po_status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground break-words">
                  {po.supplierName || `Supplier #${po.supplierId}`}
                </div>
                <div className="text-xs text-muted-foreground font-mono tabular-nums">
                  {po.order_date
                    ? new Date(po.order_date).toLocaleDateString()
                    : "—"}
                  {po.grand_total !== undefined
                    ? ` • ${formatPeso(po.grand_total)}`
                    : ""}
                </div>
              </div>
              <span className="flex items-center text-xs font-medium text-primary shrink-0">
                Select <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}