"use client";

import * as React from "react";
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { apiClient } from "@/lib/api";
import {
  InventoryItem,
  InventoryResponse,
  ProductCategory,
} from "@/lib/inventory/types";

export default function InventoryPage() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [categories, setCategories] = React.useState<Record<number, string>>(
    {},
  );

  const categoryOptions = React.useMemo(
    () =>
      Object.entries(categories).map(([id, name]) => ({
        id: Number(id),
        name,
      })),
    [categories],
  );

  const [search, setSearch] = React.useState("");
  const [size, setSize] = React.useState<string | null>(null);
  const [threadType, setThreadType] = React.useState<string | null>(null);
  const [material, setMaterial] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const limit = 20;

  const fetchInventory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<InventoryResponse>("/inventory/", {
        params: {
          search: search || undefined,
          size: size || undefined,
          thread: threadType || undefined,
          material: material || undefined,
          categoryId: category ? Number(category) : undefined,
          page,
          limit,
        },
      });

      setInventory(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError("Failed to load inventory.");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [search, size, threadType, material, category, page]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  /*
   * Get the category names for the inventory items.
   *
   * The inventory API only gives us categoryId, so we fetch:
   * GET /product-categories/{id}
   */
  React.useEffect(() => {
    const categoryIds = [
      ...new Set(
        inventory
          .map((item) => item.categoryId)
          .filter((id) => id !== null && id !== undefined),
      ),
    ];

    if (categoryIds.length === 0) {
      return;
    }

    const fetchCategories = async () => {
      try {
        const results = await Promise.all(
          categoryIds.map(async (categoryId) => {
            const response = await apiClient.get<ProductCategory>(
              `/product-categories/${categoryId}`,
            );

            return {
              id: categoryId,
              name: response.data.categoryName,
            };
          }),
        );

        setCategories((previous) => {
          const updated = { ...previous };

          results.forEach(({ id, name }) => {
            updated[id] = name;
          });

          return updated;
        });
      } catch (err) {
        console.error("Failed to fetch product categories:", err);
      }
    };

    fetchCategories();
  }, [inventory]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSizeChange = (value: string | null) => {
    setSize(value);
    setPage(1);
  };

  const handleThreadTypeChange = (value: string | null) => {
    setThreadType(value);
    setPage(1);
  };

  const handleMaterialChange = (value: string | null) => {
    setMaterial(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string | null) => {
    setCategory(value);
    setPage(1);
  };

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
        search={search}
        setSearch={handleSearchChange}
        size={size}
        setSize={handleSizeChange}
        threadType={threadType}
        setThreadType={handleThreadTypeChange}
        material={material}
        setMaterial={handleMaterialChange}
        category={category}
        setCategory={handleCategoryChange}
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
          <InventoryTable inventory={inventory} categories={categories} />

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
