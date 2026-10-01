// Data hook for the Reorder Point page of the POS inventory module.
// Loads items at or below their ROP plus category names, and keeps them fresh.
// Refetches silently on demand, on window focus and on a 30 second interval.
"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { fetchROPItems } from "./stock-rop-api";
import { InventoryItem, ProductCategory } from "./types";

const POLL_INTERVAL_MS = 30_000;

interface ROPResult {
  items: InventoryItem[];
  error: string | null;
}

// Provides ROP alert items, category names, loading/error state and a silent refetch.
export function useROPItems() {
  const [result, setResult] = useState<ROPResult | null>(null);
  const [categories, setCategories] = useState<Record<number, string>>({});

  // Loads category names once so rows can show names instead of ids.
  useEffect(() => {
    let mounted = true;

    apiClient
      .get<ProductCategory[]>("/product-categories")
      .then((response) => {
        if (!mounted || !Array.isArray(response.data)) return;
        const map: Record<number, string> = {};
        response.data.forEach((c) => {
          map[c.id] = c.categoryName;
        });
        setCategories(map);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch categories:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetches the ROP list; a failed refresh keeps the rows that are already shown.
  const refetch = useCallback(() => {
    return fetchROPItems()
      .then((items) => setResult({ items, error: null }))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load ROP data.";
        setResult((prev) =>
          prev && !prev.error ? prev : { items: [], error: message }
        );
      });
  }, []);

  useEffect(() => {
    refetch();
    window.addEventListener("focus", refetch);
    const interval = setInterval(refetch, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", refetch);
      clearInterval(interval);
    };
  }, [refetch]);

  return {
    ropItems: result?.items ?? [],
    categories,
    loading: result === null,
    error: result?.error ?? null,
    refetch,
  };
}
