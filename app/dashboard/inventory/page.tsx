// Inventory page for the Inventory Management module of the POS system.
// Fetches live inventory with parametric filters and pagination from the API.
// Renders the filter bar and the inventory table.
"use client";

import * as React from "react";
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { useInventory } from "@/lib/inventory/useInventory";

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

  const categoryOptions = React.useMemo(
    () =>
      allCategoriesList.map((cat) => ({
        id: cat.id,
        name: cat.categoryName,
      })),
    [allCategoriesList]
  );

  const handlePreviousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          Manage and monitor your inventory.
        </p>
      </div>

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

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading inventory...
        </div>
      ) : (
        <>
          <InventoryTable
            inventory={inventory}
            categories={categories}
            onRefresh={refetch}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
