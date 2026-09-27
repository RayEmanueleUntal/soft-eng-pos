"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  category: string;
  retailPrice?: number;
  wholesalePrice?: number;
}

interface BackendProduct {
  id: number;
  sku?: string | null;
  name: string;
  retail_price?: number | string | null;
  wholesale_price?: number | string | null;
  category?: { name: string } | string | null;
}

/**
 * Pure adapter function: maps raw database product into clean frontend CatalogProduct.
 */
export function toCatalogProduct(item: BackendProduct): CatalogProduct {
  const price = Number(item.retail_price ?? 0);
  const categoryName =
    typeof item.category === "object" && item.category !== null
      ? item.category.name
      : typeof item.category === "string"
      ? item.category
      : "General";

  return {
    id: item.id,
    name: item.name,
    sku: item.sku || `SKU-${item.id}`,
    price,
    retailPrice: price,
    wholesalePrice: Number(item.wholesale_price ?? price),
    category: categoryName,
  };
}

/**
 * Fetch and map catalog products from backend API.
 */
async function fetchProductsApi(): Promise<CatalogProduct[]> {
  const response = await apiClient.get<{ data: BackendProduct[] } | BackendProduct[]>("/products");
  const rawList = Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];

  return rawList.map(toCatalogProduct);
}

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
