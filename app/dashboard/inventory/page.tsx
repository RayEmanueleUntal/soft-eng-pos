// Inventory page for the Inventory Management module of the POS system.
// Fetches live inventory with parametric filters and pagination from the API.
// Renders the filter bar, status indicators, and the inventory table.
"use client";

import * as React from "react";
import {
  InventoryFilterBar,
  type StatusTab,
  type SortOption,
} from "@/app/dashboard/inventory/_components/InventoryFilterBar";
import { InventoryTable } from "@/app/dashboard/inventory/_components/InventoryTable";
import { Button } from "@/components/ui/button";
import { canEditROP, canManageStock } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { getStockStatus } from "@/lib/inventory/stock-status";
import { useInventory } from "@/lib/inventory/useInventory";
import { PageHeader } from "@/components/ui/pageheader";
import { useState } from "react";

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
  const [statusTab, setStatusTab] = React.useState<StatusTab>("all");
  const [sort, setSort] = useState<SortOption>("default");

  const categoryOptions = React.useMemo(
    () =>
      allCategoriesList.map((cat) => ({
        id: cat.id,
        name: cat.name || cat.categoryName || `Category #${cat.id}`,
      })),
    [allCategoriesList],
  );

  // Low-stock tabs and alphabetical sort apply to the rows on the current page.
  const visibleInventory = React.useMemo(() => {
    const filtered =
      statusTab === "all"
        ? inventory
        : inventory.filter(
            (item) =>
              getStockStatus(item) ===
              (statusTab === "low" ? "low-stock" : "adequate-stock"),
          );

    if (sort === "default") return filtered;

    return [...filtered].sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
  }, [inventory, statusTab, sort]);

  const handlePreviousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

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
          status={statusTab}
          setStatus={setStatusTab}
          sort={sort}
          setSort={setSort}
        />

        {statusTab !== "all" && !loading && !error && (
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
              totalRecords={statusTab === "all" ? totalRecords : visibleInventory.length}
              categories={categories}
              onRefresh={refetch}
              canManageStock={canManageStock(role)}
              canEditROP={canEditROP(role)}
            />

            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="rounded-md"
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="rounded-md"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}