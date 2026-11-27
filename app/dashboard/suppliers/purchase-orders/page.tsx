"use client";

import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { PurchaseOrderFilterBar } from "./_components/PurchaseOrderFilterBar";
import { PurchaseOrderTable } from "./_components/PurchaseOrderTable";
import { CreatePurchaseOrderModal } from "./_components/CreatePurchaseOrderModal";
import { CancelPurchaseOrderDialog } from "./_components/CancelPurchaseOrderDialog";
import { canCreatePO, canManagePOStatus } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { usePurchaseOrders } from "@/lib/inventory/usePurchaseOrders";

export default function PurchaseOrdersPage() {
  const po = usePurchaseOrders();
  const role = useCurrentRole();

  return (
    <PageShell
      title="Purchase Orders"
      subtitle="Create orders from low-stock items, inspect line items and track their status."
      cardClassName="p-4"
    >
      <PurchaseOrderFilterBar
        statusFilter={po.statusFilter}
        onStatusFilterChange={po.setStatusFilter}
        startDate={po.startDate}
        onStartDateChange={po.setStartDate}
        endDate={po.endDate}
        onEndDateChange={po.setEndDate}
        sort={po.sort}
        onSortChange={po.setSort}
        onRefresh={po.loadOrders}
        loading={po.loading}
        canCreate={canCreatePO(role)}
        onOpenCreateModal={po.openCreateModal}
      />

      {po.notice && (
        <AlertBanner
          variant={po.notice.variant === "cancelled" ? "error" : "success"}
          message={po.notice.message}
          onDismiss={po.dismissNotice}
        />
      )}

      {po.error && <AlertBanner message={po.error} onRetry={po.loadOrders} />}

      <DataTableShell
        title="Purchase Order History"
        totalRecords={po.total}
        pagination={{
          page: po.page,
          totalPages: po.totalPages,
          totalItems: po.total,
          pageSize: po.pageSize,
          itemLabel: "purchase orders",
          loading: po.loading,
          onPageChange: po.setPage,
        }}
      >
        <PurchaseOrderTable
          orders={po.orders}
          loading={po.loading}
          canCancel={canManagePOStatus(role)}
          onCancelRequest={po.setCancelTarget}
        />
      </DataTableShell>

      <CreatePurchaseOrderModal
        open={po.createOpen}
        onOpenChange={po.setCreateOpen}
        onCreated={po.handleCreated}
      />

      <CancelPurchaseOrderDialog
        order={po.cancelTarget}
        onClose={po.closeCancelDialog}
        onCancelled={po.handleCancelled}
      />
    </PageShell>
  );
}
