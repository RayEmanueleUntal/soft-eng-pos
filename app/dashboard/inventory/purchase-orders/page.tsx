// Purchase Orders page for the Inventory Management module of the POS system.
// Lists POs with expandable line items, a status filter, PO creation and cancellation of PENDING orders.
// Create and cancel actions depend on the signed-in role (backend RBAC mirrored in lib/auth/permissions).
"use client";

import * as React from "react";
import { Search, AlertCircle, CheckCircle2, Plus, RefreshCw } from "lucide-react";
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
import { PageHeader } from "@/components/ui/pageheader";
import { Label } from "@/components/ui/label";

const PAGE_LIMIT = 15;

// Renders the purchase orders list with filter, create and cancel flows.
export default function PurchaseOrdersPage() {
  const role = useCurrentRole();
  const [orders, setOrders] = React.useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<POStatus | "ALL">(
    "ALL",
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] =
    React.useState<PurchaseOrderDto | null>(null);

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

  const [notice, setNotice] = React.useState<{
    message: string;
    variant: "success" | "cancelled";
  } | null>(null);

  // Auto-dismiss after 4 seconds
  React.useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);  

  // Closes the create dialog, announces the new PO (green) and reloads the list.
  const handleCreated = (order: PurchaseOrderDto) => {
    setCreateOpen(false);
    setNotice({
      message: `Purchase order #${order.id} created.`,
      variant: "success",
    });
    if (page === 1) loadOrders();
    else setPage(1);
  };

  // Closes the cancel dialog, announces the result (red) and reloads the list.
  const handleCancelled = (order: PurchaseOrderDto) => {
    setCancelTarget(null);
    setNotice({
      message: `Purchase order #${order.id} cancelled.`,
      variant: "cancelled",
    });
    loadOrders();
  };
  

  return (
    <div className="flex-1 space-y-6 font-sans">
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
          {/* Header Bar */}
          <PageHeader
            header="Purchase Orders"
            subheader="Create orders from low-stock items, inspect line items and track their status."
          />
        </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        {notice && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-md border p-3 text-xs animate-in fade-in duration-200 ${
              notice.variant === "cancelled"
                ? "border-red-500/30 bg-red-500/10 text-red-700"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {notice.variant === "cancelled" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              {notice.message}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setNotice(null)}
              className={
                notice.variant === "cancelled"
                  ? "text-red-700 hover:bg-red-500/20 hover:text-red-900"
                  : "text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-900"
              }
            >
              Dismiss
            </Button>
          </div>
        )}

        <PurchaseOrderTable
          orders={orders}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_LIMIT}
          canCancel={canManagePOStatus(role)}
          onPageChange={setPage}
          onCancelRequest={setCancelTarget}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          onRefresh={loadOrders}
          canCreate={canCreatePO(role)}
          onOpenCreateModal={() => setCreateOpen(true)}
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
