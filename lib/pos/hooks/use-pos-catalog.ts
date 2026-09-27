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
  sku: string;
  name: string;
  retail_price?: number;
  retailPrice?: number;
  wholesale_price?: number;
  wholesalePrice?: number;
  price?: number;
  material_grade?: string;
  category?: { name: string } | string;
}

export function usePosCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      try {
        const response = await apiClient.get<{ data: BackendProduct[] } | BackendProduct[]>("/products");
        if (isCancelled) return;

        const rawList = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        if (rawList.length > 0) {
          const mappedProducts: CatalogProduct[] = rawList.map((p) => {
            const retail = Number(p.retail_price ?? p.retailPrice ?? p.price ?? 0);
            const wholesale = Number(p.wholesale_price ?? p.wholesalePrice ?? retail);
            const cat = typeof p.category === "object" && p.category !== null
              ? p.category.name
              : typeof p.category === "string"
              ? p.category
              : p.material_grade ?? "General";

            return {
              id: p.id,
              name: p.name,
              sku: p.sku || `SKU-${p.id}`,
              price: retail,
              retailPrice: retail,
              wholesalePrice: wholesale,
              category: cat,
            };
          });

          setProducts(mappedProducts);
          setError(null);
        } else {
          setProducts([]);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load products from server";
        console.error("Failed to load catalog from /products:", message);
        setProducts([]);
        setError(message);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [reloadCount]);

  return { products, loading, error, refetch };
}
