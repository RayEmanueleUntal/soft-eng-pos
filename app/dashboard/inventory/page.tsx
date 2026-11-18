// Inventory page for the Inventory Management module of the POS system.
// Fetches live inventory with parametric filters and pagination from the API.
// Renders the filter bar, status indicators, and the inventory table.
"use client";

import * as React from "react";
import {
  InventoryFilterBar,
  type StatusTab,
} from "@/app/dashboard/inventory/_components/InventoryFilterBar";
import { InventoryTable } from "@/app/dashboard/inventory/_components/InventoryTable";
import { Button } from "@/components/ui/button";
import { canEditROP, canManageStock } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { getStockStatus } from "@/lib/inventory/stock-status";
import {
  INVENTORY_PAGE_LIMIT,
  useInventory,
} from "@/lib/inventory/useInventory";
import { PageHeader } from "@/components/ui/pageheader";
import { TablePagination } from "@/components/ui/table-pagination";

// Lists inventory with filters, status tabs, pagination and role-aware row actions.
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

  // Filter by status tab first, then apply the active sort order.
  const visibleInventory = React.useMemo(() => {
    if (filters.status === "adequate") {
      return inventory.filter(
        (item) => getStockStatus(item) === "adequate-stock",
      );
    }
    return inventory;
  }, [inventory, filters.status]);

  return (
    <div className="flex-1 space-y-6">
      <div className="shrink-0 mt-4 mb-4">
        <PageHeader
          header="Inventory"
          subheader="Manage and monitor your inventory."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border flex flex-col gap-4">
        <InventoryFilterBar
          search={filters.search}
          setSearch={(v) => setFilter("search", v)}
          size={filters.size}
          setSize={(v) => setFilter("size", v)}
          threadType={filters.threadType}
          setThreadType={(v) => setFilter("threadType", v)}
          material={filters.material}
          setMaterial={(v) => setFilter("material", v)}
          category={filters.category}
          setCategory={(v) => setFilter("category", v)}
          categories={categoryOptions}
          status={filters.status}
          setStatus={(v) => setFilter("status", v)}
          sort={filters.sort}
          setSort={(v) => setFilter("sort", v)}
        />

        {filters.status === "adequate" && !loading && !error && (
          <p className="font-mono text-xs text-muted-foreground">
            {visibleInventory.length} of {inventory.length} items on this page
          </p>
        )}

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading inventory...
          </div>
        ) : (
          <>
            <InventoryTable
              inventory={visibleInventory}
              totalRecords={
                filters.status === "adequate"
                  ? visibleInventory.length
                  : totalRecords
              }
              categories={categories}
              onRefresh={refetch}
              canManageStock={canManageStock(role)}
              canEditROP={canEditROP(role)}
            />

            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={INVENTORY_PAGE_LIMIT}
              itemLabel="items"
              loading={loading}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
