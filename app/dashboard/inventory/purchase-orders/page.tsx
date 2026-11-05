// Purchase Orders page for the Inventory Management module of the POS system.
// Lists POs with expandable line items, a status filter, PO creation and cancellation of PENDING orders.
// Create and cancel actions depend on the signed-in role (backend RBAC mirrored in lib/auth/permissions).
"use client";

import * as React from "react";
import { CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canCreatePO, canManagePOStatus } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { fetchPurchaseOrderList } from "@/lib/inventory/purchase-order-api";
import {
  PO_STATUSES,
  POStatus,
  PurchaseOrderDto,
} from "@/lib/inventory/purchase-order-types";
import { getErrorMessage } from "@/lib/utils";
import { CancelPurchaseOrderDialog } from "./_components/CancelPurchaseOrderDialog";
import { CreatePurchaseOrderModal } from "./_components/CreatePurchaseOrderModal";
import { PurchaseOrderTable } from "./_components/PurchaseOrderTable";

const PAGE_LIMIT = 10;

// Renders the purchase orders list with filter, create and cancel flows.
export default function PurchaseOrdersPage() {
  const role = useCurrentRole();
  const [orders, setOrders] = React.useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<POStatus | "ALL">("ALL");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<PurchaseOrderDto | null>(null);

  // Loads the current page of purchase orders for the active status filter.
  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPurchaseOrderList({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setOrders(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load purchase orders."));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Closes the create dialog, announces the new PO and reloads the list.
  const handleCreated = (order: PurchaseOrderDto) => {
    setCreateOpen(false);
    setNotice(`Purchase order #${order.id} created.`);
    if (page === 1) loadOrders();
    else setPage(1);
  };

  // Closes the cancel dialog, announces the result and reloads the list.
  const handleCancelled = (order: PurchaseOrderDto) => {
    setCancelTarget(null);
    setNotice(`Purchase order #${order.id} cancelled.`);
    loadOrders();
  };

  return (
    <div className="flex-1 space-y-6 p-8 font-sans">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create orders from low-stock items, inspect line items and track their status.
          </p>
        </div>

        {canCreatePO(role) && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 font-semibold">
            <Plus className="h-4 w-4" /> New Purchase Order
          </Button>
        )}
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter((value ?? "ALL") as POStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full rounded-[4px] sm:w-56">
              <SelectValue placeholder="Status">
                {(value: string) =>
                  value === "ALL" ? "All statuses" : value.replace(/_/g, " ")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="ALL">All statuses</SelectItem>
              {PO_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {notice}
            </span>
            <Button variant="ghost" size="xs" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {error && (
          <div className="break-words rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <PurchaseOrderTable
          orders={orders}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          canCancel={canManagePOStatus(role)}
          onPageChange={setPage}
          onCancelRequest={setCancelTarget}
        />
      </div>

      <CreatePurchaseOrderModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <CancelPurchaseOrderDialog
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
