"use client";

// Inner content for the Shipments page. Lives under _components so the route's
// page.tsx can wrap it in <Suspense> — useShipments() reads useSearchParams(),
// which requires a suspense boundary during prerendering.

import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { ShipmentFilterBar } from "./ShipmentFilterBar";
import { ShipmentTable } from "./ShipmentTable";
import { CreateShipmentModal } from "./CreateShipmentModal";
import { UpdateShipmentStatusModal } from "@/components/inventory/UpdateShipmentStatusModal";
import { canCreateShipment, canUpdateShipment } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { useShipments } from "@/lib/inventory/useShipments";

export function ShipmentsPageContent() {
  const s = useShipments();
  const role = useCurrentRole();

  return (
    <PageShell
      title="Shipments"
      subtitle="Assign forwarders to completed orders and track delivery status."
      cardClassName="p-4"
    >
      <ShipmentFilterBar
        searchInput={s.searchInput}
        onSearchInputChange={s.setSearchInput}
        statusFilter={s.statusFilter}
        onStatusFilterChange={s.updateStatusFilter}
        startDate={s.startDate}
        onStartDateChange={s.updateStartDate}
        endDate={s.endDate}
        onEndDateChange={s.updateEndDate}
        sort={s.sort}
        onSortChange={s.updateSort}
        onRefresh={s.reload}
        loading={s.loading}
        hasActiveFilters={s.hasActiveFilters}
        onClearFilters={s.clearDateFilter}
        canCreate={canCreateShipment(role)}
        onOpenCreateModal={s.openCreateModal}
      />

      {s.notice && (
        <AlertBanner
          variant="success"
          message={s.notice}
          onDismiss={s.dismissNotice}
        />
      )}

      {s.error && <AlertBanner message={s.error} onRetry={s.reload} />}

      <DataTableShell
        title="Shipments"
        totalRecords={s.total}
        pagination={{
          page: s.page,
          totalPages: s.totalPages,
          totalItems: s.total,
          pageSize: s.pageSize,
          itemLabel: "shipments",
          loading: s.loading,
          onPageChange: s.setPage,
        }}
      >
        <ShipmentTable
          shipments={s.shipments}
          loading={s.loading}
          emptyMessage={
            s.searchInput || s.hasDateFilter
              ? "No shipments match your filters."
              : s.statusFilter === "DELIVERED"
                ? "No delivered shipments yet."
                : 'No shipments found. Use "Log Shipment" to assign a forwarder to a completed order.'
          }
          canUpdate={canUpdateShipment(role)}
          onView={s.viewShipment}
          onUpdateStatus={s.setStatusTarget}
        />
      </DataTableShell>

      <CreateShipmentModal
        open={s.createOpen}
        onOpenChange={s.setCreateOpen}
        onCreated={s.handleCreated}
      />

      <UpdateShipmentStatusModal
        shipment={s.statusTarget}
        onClose={s.closeStatusModal}
        onUpdated={s.handleStatusUpdated}
      />
    </PageShell>
  );
}
