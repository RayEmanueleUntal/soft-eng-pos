"use client";

import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "@/lib/utils";
import { fetchCategoriesApi, fetchProductsApi, ProductCategoryItem, toCatalogProduct } from "../services/pos-api";
import type { CatalogProduct, BackendProduct } from "../types/pos-types";

export { toCatalogProduct, type CatalogProduct, type BackendProduct };

interface UsePosCatalogOptions {
  search?: string;
  categoryId?: number;
}

export function usePosCatalog(options?: UsePosCatalogOptions) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);

  useEffect(() => {
    fetchCategoriesApi()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const search = options?.search;
  const categoryId = options?.categoryId;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductsApi({
        search,
        categoryId,
        limit: 100,
      });
      setProducts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load products from server";
      setError(message);
      setError(getErrorMessage(err, "Failed to load products from server"));
    } finally {
      setLoading(false);
    }
  }, [search, categoryId]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetchProductsApi({
      search,
      categoryId,
      limit: 100,
    })
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
  }, [search, categoryId]);

  return { products, loading, error, refetch, categories };
}
