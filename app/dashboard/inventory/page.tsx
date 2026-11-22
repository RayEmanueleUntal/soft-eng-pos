"use client";

import * as React from "react";
import { PageShell } from "@/components/shared/PageShell";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { DataTableShell } from "@/components/shared/DataTableShell";
import { InventoryFilterBar } from "@/app/dashboard/inventory/_components/InventoryFilterBar";
import { InventoryTable } from "@/app/dashboard/inventory/_components/InventoryTable";
import { canEditROP, canManageStock } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { getStockStatus } from "@/lib/inventory/stock-status";
import { INVENTORY_PAGE_LIMIT, useInventory } from "@/lib/inventory/useInventory";

export default function InventoryPage() {
  const {
    inventory,
    categories,
    allCategoriesList,
    filters,
    setFilter,
    page,
    setPage,
    totalPages,
    totalRecords,
    loading,
    error,
    refetch,
  } = useInventory();

  const role = useCurrentRole();

  const categoryOptions = React.useMemo(
    () =>
      allCategoriesList.map((cat) => ({
        id: cat.id,
        name: cat.name || cat.categoryName || `Category #${cat.id}`,
      })),
    [allCategoriesList],
  );

  const visibleInventory = React.useMemo(() => {
    if (filters.status === "adequate") {
      return inventory.filter(
        (item) => getStockStatus(item) === "adequate-stock",
      );
    }
    return inventory;
  }, [inventory, filters.status]);

  const effectiveTotalRecords =
    filters.status === "adequate" ? visibleInventory.length : totalRecords;

  return (
    <PageShell
      title="Inventory"
      subtitle="Manage and monitor your inventory."
    >
      <InventoryFilterBar
        search={filters.search}
        setSearch={(v) => setFilter("search", v)}
        category={filters.category}
        setCategory={(v) => setFilter("category", v)}
        categories={categoryOptions}
        status={filters.status}
        setStatus={(v) => setFilter("status", v)}
        sort={filters.sort}
        setSort={(v) => setFilter("sort", v)}
      />

      {error && <AlertBanner message={error} onRetry={refetch} />}

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading inventory...
        </div>
      ) : (
        <DataTableShell
          title="Product Profile List"
          totalRecords={effectiveTotalRecords}
          pagination={{
            page,
            totalPages,
            totalItems: totalRecords,
            pageSize: INVENTORY_PAGE_LIMIT,
            itemLabel: "items",
            loading,
            onPageChange: setPage,
          }}
        >
          <InventoryTable
            inventory={visibleInventory}
            categories={categories}
            onRefresh={refetch}
            canManageStock={canManageStock(role)}
            canEditROP={canEditROP(role)}
          />
        </DataTableShell>
      )}
    </PageShell>
  );
}