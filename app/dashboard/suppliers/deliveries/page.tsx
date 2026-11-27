"use client";

import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { DeliveriesFilterBar } from "./_components/DeliveriesFilterBar";
import { DeliveryHistoryTable } from "./_components/DeliveryHistoryTable";
import { ReceiveDeliveryModal } from "./_components/ReceiveDeliveryModal";
import { DeliveryDetailViewModal } from "./_components/DeliveryDetailViewModal";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { canManageStock } from "@/lib/auth/permissions";
import { useDeliveries } from "@/lib/inventory/useDeliveries";

export default function DeliveriesPage() {
  const d = useDeliveries();
  const role = useCurrentRole();

  return (
    <PageShell
      title="Deliveries"
      subtitle="Record incoming stock from suppliers and match deliveries against Purchase Orders."
    >
      <DeliveriesFilterBar
        sort={d.sort}
        onSortChange={d.setSort}
        startDate={d.startDate}
        onStartDateChange={d.setStartDate}
        endDate={d.endDate}
        onEndDateChange={d.setEndDate}
        onRefresh={d.loadDeliveries}
        loading={d.loading}
        hasActiveFilters={d.hasActiveFilters}
        onClearFilters={d.handleClearFilters}
        receiveAction={
          canManageStock(role) ? (
            <ReceiveDeliveryModal onSuccess={d.handleReceiveSuccess} />
          ) : undefined
        }
      />

      {d.successBanner && (
        <AlertBanner
          variant={d.successBanner.isPartial ? "warning" : "success"}
          message={`${d.successBanner.message}${
            d.successBanner.isPartial
              ? " (PO marked as partially fulfilled.)"
              : ""
          }`}
          onDismiss={d.dismissSuccessBanner}
        />
      )}

      {d.error && <AlertBanner message={d.error} onRetry={d.loadDeliveries} />}

      <DataTableShell
        title="Received Deliveries History"
        totalRecords={d.total}
        pagination={{
          page: d.page,
          totalPages: d.totalPages,
          totalItems: d.total,
          pageSize: d.pageSize,
          itemLabel: "deliveries",
          loading: d.loading,
          onPageChange: d.setPage,
        }}
      >
        <DeliveryHistoryTable
          deliveries={d.deliveries}
          loading={d.loading}
          onViewDetails={d.handleViewDetails}
        />
      </DataTableShell>

      <DeliveryDetailViewModal
        deliveryId={d.selectedDeliveryId}
        open={d.detailModalOpen}
        onOpenChange={d.setDetailModalOpen}
      />
    </PageShell>
  );
}
