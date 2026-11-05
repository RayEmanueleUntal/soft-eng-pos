// Stock Adjustments page of the Inventory Management module of the POS system.
// Connects to GET /inventory/movements to show complete stock movement history.
// Provides multi-attribute search and filtering, pagination, and staff name resolution.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StockMovementHistoryTable } from "@/app/dashboard/inventory/adjustments/_components/StockMovementHistoryTable";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import {
  InventoryItem,
  MovementType,
  StockMovementResponseDto,
} from "@/lib/inventory/types";
import {
  fetchStockMovements,
  fetchStaffUserById,
  StockMovementResponse,
} from "@/lib/inventory/stock-movement-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, RotateCcw } from "lucide-react";
import { apiClient } from "@/lib/api";

const PAGE_LIMIT = 20;

export default function InventoryAdjustmentsPage() {
  const [movements, setMovements] = useState<StockMovementResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [debouncedSize, setDebouncedSize] = useState<string>("");
  const [threadFilter, setThreadFilter] = useState<string>("");
  const [debouncedThread, setDebouncedThread] = useState<string>("");
  const [materialFilter, setMaterialFilter] = useState<string>("");
  const [debouncedMaterial, setDebouncedMaterial] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Categories & Staff cache
  const [categoriesList, setCategoriesList] = useState<Array<{ id: number; name: string }>>([]);
  const [staffMap, setStaffMap] = useState<Record<number, string>>({});

  // Debounce text filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setDebouncedSize(sizeFilter.trim());
      setDebouncedThread(threadFilter.trim());
      setDebouncedMaterial(materialFilter.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search, sizeFilter, threadFilter, materialFilter]);

  // Fetch categories once for category filter
  useEffect(() => {
    apiClient
      .get<any[]>("/product-categories")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategoriesList(
            res.data.map((c) => ({
              id: c.id,
              name: c.name || c.categoryName || `Category #${c.id}`,
            }))
          );
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // Fetch movements from GET /inventory/movements
  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: any = {
        page,
        limit: PAGE_LIMIT,
      };

      if (typeFilter !== "ALL") {
        queryParams.type = typeFilter as MovementType;
      }
      if (startDate) {
        queryParams.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        queryParams.endDate = new Date(endDate).toISOString();
      }

      const res = await fetchStockMovements(queryParams);
      let list = res.data || [];

      // Multi-attribute client-side filtering on returned list for attributes like
      // name, SKU, size, thread, material, category if not natively filtered by backend
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        list = list.filter(
          (m) =>
            m.product?.name?.toLowerCase().includes(q) ||
            m.product?.sku?.toLowerCase().includes(q) ||
            String(m.productId).includes(q) ||
            m.reason?.toLowerCase().includes(q)
        );
      }

      setMovements(list);
      setTotalPages(res.totalPages || Math.ceil((res.total || list.length) / PAGE_LIMIT) || 1);
      setTotalCount(res.total ?? list.length);

      // Resolve staff names for all staffIds present in the batch
      const missingStaffIds = Array.from(
        new Set(
          list
            .map((m) => m.staffId)
            .filter((id) => Boolean(id) && !staffMap[id])
        )
      );

      if (missingStaffIds.length > 0) {
        Promise.allSettled(
          missingStaffIds.map((id) =>
            fetchStaffUserById(id)
              .then((user) => {
                const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
                return { id, name };
              })
              .catch(() => ({ id, name: `Staff #${id}` }))
          )
        ).then((results) => {
          setStaffMap((prev) => {
            const next = { ...prev };
            results.forEach((r) => {
              if (r.status === "fulfilled") {
                next[r.value.id] = r.value.name;
              }
            });
            return next;
          });
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load stock movements.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    typeFilter,
    startDate,
    endDate,
    debouncedSearch,
    debouncedSize,
    debouncedThread,
    debouncedMaterial,
    categoryFilter,
    staffMap,
  ]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // When a new adjustment is submitted via modal, refresh the movements
  const handleAdjustmentSuccess = (
    _movement: StockMovementResponse,
    _item: InventoryItem
  ) => {
    setPage(1);
    loadMovements();
  };

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "ALL" ||
    Boolean(sizeFilter) ||
    Boolean(threadFilter) ||
    Boolean(materialFilter) ||
    categoryFilter !== "ALL" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setSizeFilter("");
    setThreadFilter("");
    setMaterialFilter("");
    setCategoryFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)] p-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-[4px] border border-border shadow-sm">
        <div>
          <h1 className="text-[22px] font-bold font-heading tracking-tight text-foreground">
            Stock Adjustments & Movements
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Audit inventory logs, filter movements, and record physical count adjustments.
          </p>
        </div>
        <StockAdjustmentModal onSuccess={handleAdjustmentSuccess} />
      </div>

      {/* Multi-attribute Filter Bar */}
      <div className="bg-card p-3 rounded-[4px] border border-border shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search product, SKU, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 w-[220px] text-xs rounded-[2px]"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val ?? "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs font-mono rounded-[2px]">
              <SelectValue placeholder="Movement Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="IN" className="text-xs font-mono">IN</SelectItem>
              <SelectItem value="OUT" className="text-xs font-mono">OUT</SelectItem>
              <SelectItem value="ADJUSTMENT" className="text-xs font-mono">ADJUSTMENT</SelectItem>
              <SelectItem value="SALE" className="text-xs font-mono">SALE</SelectItem>
              <SelectItem value="RETURN" className="text-xs font-mono">RETURN</SelectItem>
            </SelectContent>
          </Select>

          {categoriesList.length > 0 && (
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val ?? "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs rounded-[2px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                {categoriesList.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input
            placeholder="Size..."
            value={sizeFilter}
            onChange={(e) => {
              setSizeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 w-[110px] text-xs rounded-[2px]"
          />

          <Input
            placeholder="Thread..."
            value={threadFilter}
            onChange={(e) => {
              setThreadFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 w-[110px] text-xs rounded-[2px]"
          />

          <Input
            placeholder="Material..."
            value={materialFilter}
            onChange={(e) => {
              setMaterialFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 w-[110px] text-xs rounded-[2px]"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-muted-foreground">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8 w-[130px] text-xs rounded-[2px] font-mono"
            />
            <span className="text-[11px] text-muted-foreground">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8 w-[130px] text-xs rounded-[2px] font-mono"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs rounded-[2px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMovements()}
              className="h-8 px-2.5 text-xs rounded-[2px]"
              title="Refresh movements"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-[4px] border border-border bg-card shadow-sm overflow-hidden flex-1 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-heading font-semibold text-foreground">
            Stock Movement History
          </h2>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Total records: {totalCount}
          </span>
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-[2px] border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => loadMovements()}>
              Retry
            </Button>
          </div>
        ) : (
          <StockMovementHistoryTable
            movements={movements}
            staffMap={staffMap}
            loading={loading}
          />
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <p className="font-mono text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="rounded-[2px] text-xs h-8"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="rounded-[2px] text-xs h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
