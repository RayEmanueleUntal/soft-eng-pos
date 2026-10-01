// Data hook for the Inventory Management module of the POS system.
// Fetches live inventory with parametric filters, pagination, categories, polling and refetch.
// Used by the inventory page; background refreshes keep the table visible if they fail.
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api";
import { InventoryItem, InventoryResponse, ProductCategory } from "./types";

export interface InventoryFilters {
  search: string;
  size: string | null;
  threadType: string | null;
  material: string | null;
  category: string | null;
}

interface InventoryResult {
  key: string;
  inventory: InventoryItem[];
  totalPages: number;
  error: string | null;
}

const PAGE_LIMIT = 20;
const POLL_INTERVAL_MS = 30000;

// Provides inventory data, filters, pagination state and a silent refetch function.
export function useInventory() {
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [allCategoriesList, setAllCategoriesList] = useState<ProductCategory[]>([]);

  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    size: null,
    threadType: null,
    material: null,
    category: null,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<InventoryResult | null>(null);

  const fetchController = useRef<AbortController | null>(null);

  const queryKey = [
    debouncedSearch,
    filters.size,
    filters.threadType,
    filters.material,
    filters.category,
    page,
  ].join("|");

  // Debounce the search text and return to page 1 when it changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch the full category list once for the filter dropdown and the table.
  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<ProductCategory[]>("/product-categories");
        if (mounted && Array.isArray(response.data)) {
          setAllCategoriesList(response.data);
          const catMap: Record<number, string> = {};
          response.data.forEach((c) => {
            catMap[c.id] = c.categoryName;
          });
          setCategories(catMap);
        }
      } catch (err) {
        console.error("Failed to fetch all categories:", err);
      }
    };

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  // Loads the current page; a silent load keeps existing rows visible if it fails.
  const load = useCallback(
    (silent: boolean) => {
      fetchController.current?.abort();
      const controller = new AbortController();
      fetchController.current = controller;

      return apiClient
        .get<InventoryResponse>("/inventory/", {
          params: {
            search: debouncedSearch || undefined,
            size: filters.size || undefined,
            thread: filters.threadType || undefined,
            material: filters.material || undefined,
            categoryId: filters.category ? Number(filters.category) : undefined,
            page,
            limit: PAGE_LIMIT,
          },
          signal: controller.signal,
        })
        .then((response) => {
          setResult({
            key: queryKey,
            inventory: response.data.data,
            totalPages: response.data.meta.totalPages,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (axios.isCancel(err)) return;

          console.error("Failed to fetch inventory:", err);

          setResult((prev) =>
            silent && prev?.key === queryKey
              ? prev
              : {
                  key: queryKey,
                  inventory: [],
                  totalPages: 1,
                  error: "Failed to load inventory.",
                },
          );
        });
    },
    [
      debouncedSearch,
      filters.size,
      filters.threadType,
      filters.material,
      filters.category,
      page,
      queryKey,
    ],
  );

  useEffect(() => {
    load(false);
    return () => fetchController.current?.abort();
  }, [load]);

  // Silent refresh used by mutations, polling and window focus.
  const refetch = useCallback(() => load(true), [load]);

  // Polling and refetch-on-focus keep the listing close to real time.
  useEffect(() => {
    window.addEventListener("focus", refetch);
    const interval = setInterval(refetch, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", refetch);
      clearInterval(interval);
    };
  }, [refetch]);

  // Updates one filter and returns to page 1 (search resets the page after its debounce).
  const setFilter = (key: keyof InventoryFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") {
      setPage(1);
    }
  };

  const current = result?.key === queryKey ? result : null;

  return {
    inventory: current?.inventory ?? [],
    categories,
    allCategoriesList,
    filters,
    setFilter,
    page,
    setPage,
    totalPages: current?.totalPages ?? 1,
    loading: current === null,
    error: current?.error ?? null,
    refetch,
  };
}
