// Stock Adjustments page of the Inventory Management module of the POS system.
// Connects to GET /inventory/movements to show complete stock movement history.
// Provides multi-attribute search and filtering, pagination, and staff name resolution.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StockMovementHistoryTable } from "@/app/dashboard/inventory/adjustments/_components/StockMovementHistoryTable";
import {
  InventoryItem,
  InventoryResponse,
  MovementType,
  StockMovementResponseDto,
} from "@/lib/inventory/types";
import {
  fetchStockMovements,
  fetchStaffUserById,
  StockMovementResponse,
  StockMovementsQueryParams,
} from "@/lib/inventory/stock-movement-api";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { PageHeader } from "@/components/ui/pageheader";

function includesText(value: unknown, query: string): boolean {
  return String(value ?? "")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function movementMatchesProductFilters(
  movement: StockMovementResponseDto,
  filters: {
    size: string;
    thread: string;
    material: string;
    categoryId: string;
  },
): boolean {
  const product = movement.product;
  if (filters.size && !includesText(product?.size_dimensions, filters.size)) {
    return false;
  }
  if (filters.thread && !includesText(product?.thread_type, filters.thread)) {
    return false;
  }
  if (
    filters.material &&
    !includesText(product?.material_grade, filters.material)
  ) {
    return false;
  }
  if (filters.categoryId !== "ALL") {
    const productCategoryId =
      product?.categoryId ?? product?.category?.id ?? null;
    if (
      productCategoryId == null ||
      String(productCategoryId) !== filters.categoryId
    ) {
      return false;
    }
  }
  return true;
}

const PAGE_LIMIT = 20;
const PRODUCT_FILTER_LIMIT = 100;

async function fetchMatchingProductIds(params: {
  size?: string;
  thread?: string;
  material?: string;
  categoryId?: number;
}): Promise<Set<number>> {
  const ids = new Set<number>();
  let pageNum = 1;
  let totalPages = 1;

  do {
    const productsRes = await apiClient.get<InventoryResponse>("/products", {
      params: {
        ...params,
        page: pageNum,
        limit: PRODUCT_FILTER_LIMIT,
      },
    });
    const items = productsRes.data?.data ?? [];
    items.forEach((item) => ids.add(item.id));
    totalPages = Math.max(1, productsRes.data?.meta?.totalPages ?? 1);
    pageNum += 1;
  } while (pageNum <= totalPages);

  return ids;
}

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
  const [categoriesList, setCategoriesList] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [staffMap, setStaffMap] = useState<Record<number, string>>({});
  const staffMapRef = useRef(staffMap);

  // Success banner for stock adjustments
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    staffMapRef.current = staffMap;
  }, [staffMap]);

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
      .get<Array<{ id: number; name?: string; categoryName?: string }>>(
        "/product-categories",
      )
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategoriesList(
            res.data.map((c) => ({
              id: c.id,
              name: c.name || c.categoryName || `Category #${c.id}`,
            })),
          );
        }
      })
      .catch((err) =>
        console.error(
          "Failed to fetch categories:",
          getErrorMessage(err, "Failed to fetch categories."),
        ),
      );
  }, []);

  // Fetch movements from GET /inventory/movements
  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: StockMovementsQueryParams = {
        page,
        limit: PAGE_LIMIT,
      };

      if (typeFilter !== "ALL") {
        queryParams.type = typeFilter as MovementType;
      }
      // Read the picked days in local time (like the Expenses page), so the
      // range covers the whole day: 00:00:00 to 23:59:59.999.
      if (startDate) {
        queryParams.startDate = new Date(`${startDate}T00:00:00`).toISOString();
      }
      if (endDate) {
        queryParams.endDate = new Date(`${endDate}T23:59:59.999`).toISOString();
      }

      const needsProductAttrFilter =
        Boolean(debouncedSize) ||
        Boolean(debouncedThread) ||
        Boolean(debouncedMaterial) ||
        categoryFilter !== "ALL";

      let allowedProductIds: Set<number> | null = null;
      if (needsProductAttrFilter) {
        try {
          allowedProductIds = await fetchMatchingProductIds({
            size: debouncedSize || undefined,
            thread: debouncedThread || undefined,
            material: debouncedMaterial || undefined,
            categoryId:
              categoryFilter !== "ALL" ? Number(categoryFilter) : undefined,
          });
          if (allowedProductIds.size === 1) {
            queryParams.productId = Array.from(allowedProductIds)[0];
          }
        } catch (err) {
          console.error(
            "Failed to resolve product filters:",
            getErrorMessage(err, "Failed to resolve product filters."),
          );
        }
      }

      const res = await fetchStockMovements(queryParams);
      let list = res.data || [];

      if (allowedProductIds) {
        const matchingIds = allowedProductIds;
        list = list.filter((m) => matchingIds.has(m.productId));
      } else if (needsProductAttrFilter) {
        list = list.filter((m) =>
          movementMatchesProductFilters(m, {
            size: debouncedSize,
            thread: debouncedThread,
            material: debouncedMaterial,
            categoryId: categoryFilter,
          }),
        );
      }

      if (debouncedSearch) {
        list = list.filter(
          (m) =>
            includesText(m.product?.name, debouncedSearch) ||
            includesText(m.product?.sku, debouncedSearch) ||
            includesText(m.productId, debouncedSearch) ||
            includesText(m.reason, debouncedSearch),
        );
      }

      setMovements(list);
      setTotalPages(
        res.totalPages ||
          Math.ceil((res.total || list.length) / PAGE_LIMIT) ||
          1,
      );
      setTotalCount(res.total ?? list.length);

      // Resolve staff names for all staffIds present in the batch
      const knownStaff = staffMapRef.current;
      const missingStaffIds = Array.from(
        new Set(
          list
            .filter((m) => !m.staff) // the backend already sends the name with each movement
            .map((m) => m.staffId)
            .filter((id) => Boolean(id) && !knownStaff[id]),
        ),
      );

      if (missingStaffIds.length > 0) {
        Promise.allSettled(
          missingStaffIds.map((id) =>
            fetchStaffUserById(id)
              .then((user) => {
                const name =
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  user.username;
                return { id, name };
              })
              .catch(() => ({ id, name: `Staff #${id}` })),
          ),
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load stock movements."));
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
  ]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // When a new adjustment is submitted via modal, show the banner & refresh movements
  const handleAdjustmentSuccess = (
    _movement: StockMovementResponse,
    item: InventoryItem,
  ) => {
    setSuccessMessage(`${item.name} adjusted successfully.`);
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
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)] space-y-5">
      <div className="shrink-0 mt-4 mb-4">
        {/* Header Bar */}
        <PageHeader
          header="Stock Movements & Adjustments"
          subheader="Audit inventory logs, filter movements, and record physical count adjustments."
        />
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="shrink-0 mb-3 flex items-center justify-between gap-2 text-xs font-sans p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Movements Table */}
      <div className="rounded-[4px] border border-border bg-card shadow-sm overflow-hidden flex-1 p-4 space-y-4">

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
            search={search}
            totalCount={totalCount}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            categoriesList={categoriesList}
            startDate={startDate}
            onStartDateChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            endDate={endDate}
            onEndDateChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            onRefresh={() => loadMovements()}
            onAdjustmentSuccess={handleAdjustmentSuccess}
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