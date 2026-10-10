// Inventory page for the Inventory Management module of the POS system.
// Fetches live inventory with parametric filters and pagination from the API.
// Renders the filter bar, the All/Low/Adequate tabs and the inventory table.
"use client";

import * as React from "react";
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canEditROP, canManageStock } from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { getStockStatus } from "@/lib/inventory/stock-status";
import { useInventory } from "@/lib/inventory/useInventory";

type StatusTab = "all" | "low" | "adequate";

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
    loading,
    error,
    refetch
  } = useInventory();

  const role = useCurrentRole();
  const [statusTab, setStatusTab] = React.useState<StatusTab>("all");

  const categoryOptions = React.useMemo(
    () =>
      allCategoriesList.map((cat) => ({
        id: cat.id,
        name: cat.categoryName,
      })),
    [allCategoriesList]
  );

  // Low-stock tabs only filter the rows on the current page (the list is paginated server-side).
  const visibleInventory = React.useMemo(() => {
    if (statusTab === "all") {
      return inventory;
    }

    const wanted = statusTab === "low" ? "low-stock" : "adequate-stock";
    return inventory.filter((item) => getStockStatus(item) === wanted);
  }, [inventory, statusTab]);

  const handlePreviousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and monitor your inventory.
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border flex flex-col gap-4">
        <InventoryFilterBar
          search={filters.search}
          setSearch={(v) => setFilter('search', v)}
          size={filters.size}
          setSize={(v) => setFilter('size', v)}
          threadType={filters.threadType}
          setThreadType={(v) => setFilter('threadType', v)}
          material={filters.material}
          setMaterial={(v) => setFilter('material', v)}
          category={filters.category}
          setCategory={(v) => setFilter('category', v)}
          categories={categoryOptions}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={statusTab}
            onValueChange={(value) => setStatusTab(value as StatusTab)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="low">Low Stock</TabsTrigger>
              <TabsTrigger value="adequate">Adequate</TabsTrigger>
            </TabsList>
          </Tabs>

          {statusTab !== "all" && !loading && !error && (
            <p className="font-mono text-xs text-muted-foreground">
              {visibleInventory.length} of {inventory.length} items on this page
            </p>
          )}
        </div>

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
