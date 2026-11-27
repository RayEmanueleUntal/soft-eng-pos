"use client";

import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { ForwarderFilterBar } from "./_components/ForwarderFilterBar";
import { ForwarderTable } from "./_components/ForwarderTable";
import { CreateForwarderModal } from "./_components/CreateForwarderModal";
import { EditForwarderModal } from "./_components/EditForwarderModal";
import { DeleteForwarderModal } from "./_components/DeleteForwarderModal";
import { useForwarders } from "@/lib/forwarders/useForwarders";

export default function ForwardersPage() {
  const f = useForwarders();

  return (
    <PageShell
      title="Forwarders Management"
      subtitle="Manage courier and logistics vendor accounts, contact channels, and status tracking."
    >
      <ForwarderFilterBar
        searchQuery={f.searchQuery}
        onSearchChange={f.handleSearchChange}
        statusFilter={f.statusFilter}
        onStatusFilterChange={f.handleStatusFilterChange}
        sort={f.sort}
        onSortChange={f.handleSortChange}
        onOpenCreateModal={f.openCreateModal}
      />

      {f.successMsg && (
        <AlertBanner
          variant="success"
          message={f.successMsg}
          onDismiss={f.dismissSuccess}
        />
      )}

      {f.error && <AlertBanner message={f.error} onRetry={f.fetchForwarders} />}

      <DataTableShell
        title="Forwarder Profile List"
        totalRecords={f.total}
        pagination={{
          page: f.page,
          totalPages: f.totalPages,
          totalItems: f.total,
          pageSize: f.pageSize,
          itemLabel: "forwarders",
          loading: f.loading,
          onPageChange: f.setPage,
        }}
      >
        <ForwarderTable
          data={f.forwarders}
          loading={f.loading}
          onEdit={f.setEditTarget}
          onDelete={f.setDeleteTarget}
        />
      </DataTableShell>

      <CreateForwarderModal
        open={f.createModalOpen}
        onOpenChange={f.setCreateModalOpen}
        onSuccess={f.handleCreated}
      />

      <EditForwarderModal
        forwarder={f.editTarget}
        open={!!f.editTarget}
        onOpenChange={f.handleEditOpenChange}
        onSuccess={f.handleUpdated}
      />

      <DeleteForwarderModal
        forwarder={f.deleteTarget}
        open={!!f.deleteTarget}
        onOpenChange={f.handleDeleteOpenChange}
        onSuccess={f.handleDeleted}
      />
    </PageShell>
  );
}
