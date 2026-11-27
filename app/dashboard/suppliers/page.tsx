"use client";

import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { SupplierFilterBar } from "./_components/SupplierFilterBar";
import { SupplierTable } from "./_components/SupplierTable";
import { SupplierModal } from "./_components/SupplierModal";
import { SupplierDeleteDialog } from "./_components/SupplierDeleteDialog";
import { useSuppliers } from "@/lib/suppliers/useSuppliers";

export default function SuppliersPage() {
  const s = useSuppliers();

  return (
    <PageShell
      title="Suppliers"
      subtitle="Manage procurement contacts and delivery lead times."
    >
      <SupplierFilterBar
        search={s.searchTerm}
        onSearchChange={s.setSearchTerm}
        status={s.statusFilter}
        onStatusChange={s.setStatusFilter}
        sort={s.sortOrder}
        onSortChange={s.setSortOrder}
        onAdd={s.openCreateModal}
      />

      {s.feedback && (
        <AlertBanner
          variant={s.feedback.type}
          message={s.feedback.message}
          onDismiss={s.dismissFeedback}
        />
      )}

      <DataTableShell
        title="Supplier Profile List"
        totalRecords={s.totalItems}
        pagination={{
          page: s.currentPage,
          totalPages: s.totalPages,
          totalItems: s.totalItems,
          pageSize: s.pageSize,
          itemLabel: "suppliers",
          loading: s.loading,
          onPageChange: s.setCurrentPage,
        }}
      >
        <SupplierTable
          suppliers={s.suppliers}
          loading={s.loading}
          onEdit={s.openEditModal}
          onDelete={s.openDeleteDialog}
        />
      </DataTableShell>

      <SupplierModal
        isOpen={s.isModalOpen}
        onClose={s.closeModal}
        onSubmit={s.handleCreateOrUpdate}
        initialData={s.selectedSupplier}
        isLoading={s.actionLoading}
      />

      <SupplierDeleteDialog
        isOpen={s.isDeleteDialogOpen}
        supplierName={
          s.supplierToDelete?.companyName || s.supplierToDelete?.name
        }
        onClose={s.closeDeleteDialog}
        onConfirm={s.handleDelete}
        isLoading={s.actionLoading}
      />
    </PageShell>
  );
}
