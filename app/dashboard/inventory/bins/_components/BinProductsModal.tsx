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
  sku?: string | null;
  name: string;
  categoryId?: number | null;
  category_name?: string | null;
  size_dimensions?: string | null;
  thread_type?: string | null;
  material_grade?: string | null;
  current_quantity: number;
  binId?: number | null;
  bin_aisle_number?: string | null;
  bin_shelf_location?: string | null;
}

interface ProductsResponse {
  data: BinProductItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface BinProductsModalProps {
  bin: BinLocation;
  page: number;
  pageSize: number;
  onTotalChange: (total: number) => void;
  onLoadingChange: (loading: boolean) => void;
}

const CACHE_TTL_MS = 5 * 60_000;
const SESSION_CACHE_KEY = "pos_bin_catalog_cache_v3";

interface CatalogCache {
  products: BinProductItem[];
  fetchedAt: number;
}

let memoryCache: CatalogCache | null = null;
let preferredLimit = 1000; // Automatically drops to 100 if backend DTO caps limit

function readCache(): BinProductItem[] | null {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache.products;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (raw) {
        const parsed: CatalogCache = JSON.parse(raw);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
          memoryCache = parsed;
          return parsed.products;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

function writeCache(products: BinProductItem[]) {
  const entry: CatalogCache = { products, fetchedAt: Date.now() };
  memoryCache = entry;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(entry));
    } catch {
      // Ignore storage errors
    }
  }
}

export function invalidateBinCatalogCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}

async function fetchProductsPage(page: number) {
  try {
    return await apiClient.get<ProductsResponse>("/products", {
      params: { page, limit: preferredLimit },
    });
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    // If DTO has @Max(100) on limit, fall back to 100 once and remember it
    if (status === 400 && preferredLimit > 100) {
      preferredLimit = 100;
      return await apiClient.get<ProductsResponse>("/products", {
        params: { page, limit: 100 },
      });
    }
    throw err;
  }
}

export function BinProductsModal({
  bin,
  page,
  pageSize,
  onTotalChange,
  onLoadingChange,
}: BinProductsModalProps) {
  const [products, setProducts] = React.useState<BinProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const matchesBin = (item: BinProductItem) => {
      if (item.binId !== undefined && item.binId !== null) {
        return Number(item.binId) === Number(bin.id);
      }
      return (
        (item.bin_aisle_number ?? "").trim().toLowerCase() ===
          bin.aisle_number.trim().toLowerCase() &&
        (item.bin_shelf_location ?? "").trim().toLowerCase() ===
          bin.shelf_location.trim().toLowerCase()
      );
    };

    async function load() {
      setError(null);

      // 1. Instant hit if cached
      const cached = readCache();
      if (cached) {
        const filtered = cached.filter(matchesBin);
        setProducts(filtered);
        onTotalChange(filtered.length);
        setLoading(false);
        onLoadingChange(false);
        return;
      }

      setLoading(true);
      onLoadingChange(true);

      try {
        const firstRes = await fetchProductsPage(1);
        if (!active) return;

        const firstItems = firstRes.data?.data ?? [];
        const totalPages = firstRes.data?.meta?.totalPages ?? 1;
        const allProducts = [...firstItems];

        // Show matches from batch 1 immediately
        const initialMatches = allProducts.filter(matchesBin);
        setProducts(initialMatches);
        onTotalChange(initialMatches.length);
        if (initialMatches.length > 0 || totalPages === 1) {
          setLoading(false);
          onLoadingChange(false);
        }

        // Fetch remaining pages in small parallel batches of 4 (fast + stays well below 100 req/60s)
        const BATCH_SIZE = 4;
        for (let p = 2; p <= totalPages; p += BATCH_SIZE) {
          if (!active) return;
          const batchPages = Array.from(
            { length: Math.min(BATCH_SIZE, totalPages - p + 1) },
            (_, idx) => p + idx,
          );

          const responses = await Promise.all(
            batchPages.map((pageNum) => fetchProductsPage(pageNum)),
          );
          if (!active) return;

          for (const res of responses) {
            allProducts.push(...(res.data?.data ?? []));
          }

          const updatedMatches = allProducts.filter(matchesBin);
          setProducts(updatedMatches);
          onTotalChange(updatedMatches.length);
          if (updatedMatches.length > 0) {
            setLoading(false);
            onLoadingChange(false);
          }
        }

        writeCache(allProducts);
      } catch (err: unknown) {
        if (active) {
          setError(
            getErrorMessage(err, "Failed to load products for this bin."),
          );
          setProducts([]);
          onTotalChange(0);
        }
      } finally {
        if (active) {
          setLoading(false);
          onLoadingChange(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [bin.id, bin.aisle_number, bin.shelf_location]);

  // Slice to 15 rows for the active page
  const paginatedProducts = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, page, pageSize]);

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
        <div className="max-h-[480px] overflow-auto rounded-md border border-border">
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
              {paginatedProducts.map((item) => {
                const categoryLabel =
                  item.category_name ||
                  (item.categoryId ? `Category #${item.categoryId}` : "-");

                return (
                  <TableRow key={item.id} className="text-xs">
                    {/* Product Name & SKU */}
                    <TableCell className="align-top py-3 whitespace-normal max-w-[240px]">
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
                    <TableCell className="align-top py-3 whitespace-normal max-w-[220px]">
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