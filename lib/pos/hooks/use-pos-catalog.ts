"use client";

import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "@/lib/utils";
import { fetchProductsApi, toCatalogProduct } from "../services/pos-api";
import type { CatalogProduct, BackendProduct } from "../types/pos-types";

export { toCatalogProduct, type CatalogProduct, type BackendProduct };

export function usePosCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductsApi();
      setProducts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load products from server";
      setError(message);
      setError(getErrorMessage(err, "Failed to load products from server"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchProductsApi()
      .then((data) => {
        if (!ignore) {
          setProducts(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to load products from server";
          setError(message);
          setError(getErrorMessage(err, "Failed to load products from server"));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { products, loading, error, refetch };
}
