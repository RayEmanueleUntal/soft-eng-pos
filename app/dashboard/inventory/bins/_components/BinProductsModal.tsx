// components/inventory/bin/BinProductsModal.tsx
"use client";

import * as React from "react";
import { Loader2, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { BinLocation } from "@/lib/bin-locations/bin-locations";
import { getErrorMessage } from "@/lib/utils";

interface BinProductItem {
  id: number;
  name: string;
  sku?: string | null;
  categoryId?: number | null;
  category_name?: string | null;
  category?: { id: number; name?: string; categoryName?: string } | null;
  size_dimensions?: string | null;
  thread_type?: string | null;
  material_grade?: string | null;
  current_quantity: number;
  binLocationId?: number | null;
  binId?: number | null;
  bin_aisle_number?: string | null;
  bin_shelf_location?: string | null;
}

interface BinProductsModalProps {
  bin: BinLocation;
}

const PAGE_LIMIT = 100;
const CACHE_TTL_MS = 5 * 60_000;
const SESSION_CACHE_KEY = "pos_bin_catalog_cache_v1";

interface CatalogCache {
  products: BinProductItem[];
  categories: Record<number, string>;
  fetchedAt: number;
}

let memoryCache: CatalogCache | null = null;
let inFlightFetch: Promise<{
  products: BinProductItem[];
  categories: Record<number, string>;
}> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readCache(): CatalogCache | null {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (raw) {
        const parsed: CatalogCache = JSON.parse(raw);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
          memoryCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

function writeCache(data: CatalogCache) {
  memoryCache = data;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }
}

async function fetchWithRetry<T>(
  requestFn: () => Promise<T>,
  retries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 429 && attempt < retries) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Too many requests. Please wait a moment and try again.");
}

async function fetchCatalogWithCache(): Promise<{
  products: BinProductItem[];
  categories: Record<number, string>;
}> {
  const existing = readCache();
  if (existing) {
    return {
      products: existing.products,
      categories: existing.categories,
    };
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      // Only pass allowed query params (page & limit)
      const firstRes = await fetchWithRetry(() =>
        apiClient.get("/products", {
          params: { page: 1, limit: PAGE_LIMIT },
        }),
      );

      const firstItems: BinProductItem[] = Array.isArray(firstRes.data)
        ? firstRes.data
        : Array.isArray(firstRes.data?.data)
          ? firstRes.data.data
          : [];

      const meta = firstRes.data?.meta;
      const totalPages =
        typeof meta?.totalPages === "number"
          ? meta.totalPages
          : typeof meta?.total === "number"
            ? Math.ceil(meta.total / PAGE_LIMIT)
            : 1;

      const allProducts = [...firstItems];

      for (let page = 2; page <= totalPages; page++) {
        await sleep(1200);
        const res = await fetchWithRetry(() =>
          apiClient.get("/products", {
            params: { page, limit: PAGE_LIMIT },
          }),
        );
        const pageItems: BinProductItem[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        allProducts.push(...pageItems);
      }

      const needsCategoryLookup = allProducts.some(
        (p) =>
          p.categoryId &&
          !p.category_name &&
          !p.category?.name &&
          !p.category?.categoryName,
      );

      const catMap: Record<number, string> = {};
      if (needsCategoryLookup) {
        await sleep(1200);
        const categoriesRes = await fetchWithRetry(() =>
          apiClient.get<{ id: number; name?: string; categoryName?: string }[]>(
            "/product-categories",
          ),
        ).catch(() => ({ data: [] }));

        if (Array.isArray(categoriesRes.data)) {
          categoriesRes.data.forEach((c) => {
            catMap[c.id] = c.name || c.categoryName || `Category #${c.id}`;
          });
        }
      }

      writeCache({
        products: allProducts,
        categories: catMap,
        fetchedAt: Date.now(),
      });

      return { products: allProducts, categories: catMap };
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

export function BinProductsModal({ bin }: BinProductsModalProps) {
  const [products, setProducts] = React.useState<BinProductItem[]>([]);
  const [categories, setCategories] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Inside useEffect in BinProductsModal.tsx:
React.useEffect(() => {
  let active = true;
  setLoading(true);
  setError(null);
  setProducts([]); // Reset on bin change

  const matchesBin = (item: BinProductItem) => {
    const itemBinId = item.binLocationId ?? item.binId;
    if (itemBinId !== undefined && itemBinId !== null) {
      return Number(itemBinId) === Number(bin.id);
    }
    return (
      (item.bin_aisle_number ?? "").trim().toLowerCase() ===
        bin.aisle_number.trim().toLowerCase() &&
      (item.bin_shelf_location ?? "").trim().toLowerCase() ===
        bin.shelf_location.trim().toLowerCase()
    );
  };

  const loadProgressively = async () => {
    try {
      // 1. Fetch page 1 immediately
      const firstRes = await apiClient.get("/products", {
        params: { page: 1, limit: 100 },
      });
      if (!active) return;

      const firstItems: BinProductItem[] = Array.isArray(firstRes.data?.data)
        ? firstRes.data.data
        : Array.isArray(firstRes.data)
          ? firstRes.data
          : [];

      // Immediately show matches from page 1 and stop full-screen spinner
      setProducts(firstItems.filter(matchesBin));
      setLoading(false);

      const meta = firstRes.data?.meta;
      const totalPages =
        typeof meta?.totalPages === "number"
          ? meta.totalPages
          : typeof meta?.total === "number"
            ? Math.ceil(meta.total / 100)
            : 1;

      // 2. Append matches from remaining pages in the background
      for (let page = 2; page <= totalPages; page++) {
        if (!active) return;
        await new Promise((r) => setTimeout(r, 150));
        const res = await apiClient.get("/products", {
          params: { page, limit: 100 },
        });
        if (!active) return;

        const pageItems: BinProductItem[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const matched = pageItems.filter(matchesBin);
        if (matched.length > 0) {
          setProducts((prev) => [...prev, ...matched]);
        }
      }
    } catch (err: unknown) {
      if (active) {
        setError(getErrorMessage(err, "Failed to load products for this bin."));
        setLoading(false);
      }
    }
  };

  loadProgressively();
  return () => {
    active = false;
  };
}, [bin.id, bin.aisle_number, bin.shelf_location]);

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          <Package className="h-3.5 w-3.5 text-[#0060B2]" />
          <span>Assigned Products ({loading ? "…" : products.length})</span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground rounded-md border border-border bg-muted/20">
          <Loader2 className="h-5 w-5 animate-spin text-[#0060B2]" />
          <span className="text-xs">Loading assigned products...</span>
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/30 p-3">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground rounded-md border border-dashed border-border bg-muted/20">
          No products are currently assigned to this bin location.
        </div>
      ) : (
        <div className="max-h-[400px] overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader className="bg-muted/95 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Product
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">
                  Specifications
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-right font-mono">
                  Current Qty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => {
                const categoryLabel =
                  item.category_name ||
                  item.category?.name ||
                  item.category?.categoryName ||
                  (item.categoryId
                    ? categories[item.categoryId] ||
                      `Category #${item.categoryId}`
                    : "-");

                return (
                  <TableRow key={item.id} className="text-xs">
                    {/* Product Name & SKU */}
                    <TableCell className="align-top py-3 whitespace-normal max-w-[220px]">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground break-words">
                          {item.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground break-all mt-0.5">
                          {item.sku ?? "-"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Category Badge */}
                    <TableCell className="align-top py-3 whitespace-normal max-w-[160px]">
                      {categoryLabel !== "-" ? (
                        <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground break-words">
                          {categoryLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Specifications (Size, Thread, Material) */}
                    <TableCell className="align-top py-3 whitespace-normal max-w-[200px]">
                      <div className="space-y-0.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Size:</span>{" "}
                          <span className="font-medium text-foreground">
                            {item.size_dimensions || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Thread:</span>{" "}
                          <span className="font-medium text-foreground">
                            {item.thread_type || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Material:
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {item.material_grade || "-"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Current Quantity */}
                    <TableCell className="align-top py-3 text-right font-mono font-bold text-sm text-foreground tabular-nums whitespace-nowrap">
                      {Number(item.current_quantity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}