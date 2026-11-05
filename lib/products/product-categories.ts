// API helpers and hook for product categories (GET /product-categories).
// Used by the products filter bar and the product form category selector.
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { ProductCategory } from "./types";

export async function getProductCategories(): Promise<ProductCategory[]> {
  const response = await apiClient.get<ProductCategory[]>("/product-categories");
  return Array.isArray(response.data) ? response.data : [];
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    getProductCategories()
      .then((data) => {
        if (!mounted) return;
        setCategories(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(getErrorMessage(err, "Failed to load categories."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const refetch = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return { categories, loading, error, refetch };
}
