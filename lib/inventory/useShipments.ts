"use client";

// State and data flow for the Shipments page.
// Owns the debounced search, status/date filters, client-side sort, the
// active+history merge with request-sequence guard, and modal state.
// Backend has no sort params, so sorting runs client-side on the merged set.
//
// Fetching is keyed only by statusFilter + search: the full match set is
// cached in `allItems` and page/date/sort changes slice it locally, so paging
// never re-downloads history. Filter state lives in the URL so returning from
// the detail page restores the same list.

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fetchActiveShipments,
  fetchShipmentHistory,
} from "./shipment-api";
import {
  PaginatedShipments,
  Shipment,
  TrackingStatus,
} from "./shipment-types";
import { STATUS_LABELS } from "./shipment-utils";
import { SortKey, sortItems } from "@/lib/utils/sort";
import { getErrorMessage } from "@/lib/utils";

export type ShipmentFilter = "ALL" | TrackingStatus;

const PAGE_LIMIT = 15;
const FETCH_LIMIT = 100;

const SHIPMENT_STATUS_FILTERS: ShipmentFilter[] = [
  "ALL",
  "PENDING",
  "DISPATCHED",
  "DELIVERED",
];
const SHIPMENT_SORTS: SortKey[] = [
  "DEFAULT",
  "DATE_ASC",
  "DATE_DESC",
  "ID_ASC",
  "ID_DESC",
];

const SORT_ACCESSORS = {
  getDate: (s: Shipment) => s.dispatch_date,
  getId: (s: Shipment) => s.id,
};

// Client-side sorting/pagination needs the full match set, not just the
// first API page — loops through every page of a paginated endpoint.
async function fetchAllShipmentPages(
  fetchPage: (page: number) => Promise<PaginatedShipments>,
): Promise<Shipment[]> {
  const first = await fetchPage(1);
  const items = [...(first.items ?? [])];
  const totalPages = first.meta?.totalPages ?? 1;
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
    );
    for (const res of rest) items.push(...(res.items ?? []));
  }
  return items;
}

function matchesShipmentDateRange(
  shipment: Shipment,
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate && !endDate) return true;

  const rawDate =
    (shipment as any).created_at ??
    (shipment as any).createdAt ??
    (shipment as any).dispatched_at ??
    (shipment as any).delivered_at;

  if (!rawDate) return false;

  const ts = new Date(rawDate).getTime();
  if (Number.isNaN(ts)) return true;

  if (startDate) {
    const startTs = new Date(`${startDate}T00:00:00`).getTime();
    if (ts < startTs) return false;
  }
  if (endDate) {
    const endTs = new Date(`${endDate}T23:59:59.999`).getTime();
    if (ts > endTs) return false;
  }
  return true;
}

function parseStatusParam(value: string | null): ShipmentFilter {
  return SHIPMENT_STATUS_FILTERS.includes(value as ShipmentFilter)
    ? (value as ShipmentFilter)
    : "ALL";
}

function parseSortParam(value: string | null): SortKey {
  return SHIPMENT_SORTS.includes(value as SortKey)
    ? (value as SortKey)
    : "DEFAULT";
}

function parsePageParam(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useShipments() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // List settings live in the URL so returning from the detail page restores them.
  const [statusFilter, setStatusFilter] = React.useState<ShipmentFilter>(() =>
    parseStatusParam(searchParams.get("status")),
  );
  const [startDate, setStartDate] = React.useState(
    () => searchParams.get("from") ?? "",
  );
  const [endDate, setEndDate] = React.useState(
    () => searchParams.get("to") ?? "",
  );
  const [sort, setSort] = React.useState<SortKey>(() =>
    parseSortParam(searchParams.get("sort")),
  );
  const [page, setPage] = React.useState(() =>
    parsePageParam(searchParams.get("page")),
  );
  const [searchInput, setSearchInput] = React.useState(
    () => searchParams.get("q") ?? "",
  );
  const [search, setSearch] = React.useState(
    () => (searchParams.get("q") ?? "").trim(),
  );

  // Full match set for the current statusFilter + search; page/date/sort
  // are applied on top of this without refetching.
  const [allItems, setAllItems] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Shipment | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const requestId = React.useRef(0);

  // Applies the search box after a short pause. Page resets only when the
  // committed search actually changes, so a URL-restored page survives mount.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (next === search) return;
      setSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Resyncs state when the URL query changes externally (e.g. the nav link
  // drops the query string). Values matching current state bail out, so the
  // hook's own router.replace below does not loop.
  React.useEffect(() => {
    setStatusFilter(parseStatusParam(searchParams.get("status")));
    setStartDate(searchParams.get("from") ?? "");
    setEndDate(searchParams.get("to") ?? "");
    setSort(parseSortParam(searchParams.get("sort")));
    setPage(parsePageParam(searchParams.get("page")));
    const q = searchParams.get("q") ?? "";
    setSearchInput(q);
    setSearch(q.trim());
  }, [searchParams]);

  // Serializes the current filters into a query string (shared by URL sync and the detail return link).
  const buildListQuery = React.useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (startDate) params.set("from", startDate);
    if (endDate) params.set("to", endDate);
    if (sort !== "DEFAULT") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [search, statusFilter, startDate, endDate, sort, page, pathname]);

  // Mirrors the filters into the URL so browser back/forward and detail-page
  // returns restore the same list state.
  React.useEffect(() => {
    router.replace(buildListQuery(), { scroll: false });
  }, [buildListQuery, router]);

  // Loads the full match set only when statusFilter or the committed search
  // changes (or on explicit reload). Date range, sort, and page are applied
  // client-side on top, so paging never re-fetches.
  React.useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    const load = async () => {
      if (statusFilter === "DELIVERED") {
        return fetchAllShipmentPages((p) =>
          fetchShipmentHistory({ page: p, limit: FETCH_LIMIT, search }),
        );
      }
      if (statusFilter === "PENDING" || statusFilter === "DISPATCHED") {
        const items = await fetchAllShipmentPages((p) =>
          fetchActiveShipments({ page: p, limit: FETCH_LIMIT, search }),
        );
        return items.filter((item) => item.tracking_status === statusFilter);
      }
      // statusFilter === "ALL": combine active (PENDING/DISPATCHED) and history (DELIVERED)
      const [activeItems, historyItems] = await Promise.all([
        fetchAllShipmentPages((p) =>
          fetchActiveShipments({ page: p, limit: FETCH_LIMIT, search }),
        ),
        fetchAllShipmentPages((p) =>
          fetchShipmentHistory({ page: p, limit: FETCH_LIMIT, search }),
        ),
      ]);
      return [...activeItems, ...historyItems];
    };

    load()
      .then((items) => {
        if (current !== requestId.current) return;
        setAllItems(items);
        setLoading(false);
      })
      .catch((err) => {
        if (current !== requestId.current) return;
        console.error("Failed to load shipments:", err);
        setError(
          getErrorMessage(
            err,
            "Failed to load shipments. Please check your connection.",
          ),
        );
        setAllItems([]);
        setLoading(false);
      });
  }, [statusFilter, search, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const updateStatusFilter = (value: ShipmentFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const updateStartDate = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const updateEndDate = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const updateSort = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setSort("DEFAULT");
    setPage(1);
  };

  const handleCreated = (shipment: Shipment) => {
    setNotice(
      `Shipment #${shipment.id} logged for ${
        shipment.transaction?.invoice_number ?? `order #${shipment.transactionId}`
      } (Pending).`,
    );
    setStatusFilter("ALL");
    setPage(1);
    reload();
  };

  const handleStatusUpdated = (shipment: Shipment) => {
    setStatusTarget(null);
    setNotice(
      `Shipment #${shipment.id} is now ${STATUS_LABELS[shipment.tracking_status]}.`,
    );
    reload();
  };

  const viewShipment = (shipment: Shipment) => {
    const back = encodeURIComponent(buildListQuery());
    router.push(`/dashboard/forwarders/shipments/view/${shipment.id}?back=${back}`);
  };

  const openCreateModal = () => {
    setNotice(null);
    setCreateOpen(true);
  };

  const closeStatusModal = () => setStatusTarget(null);

  // Client-side pipeline: date filter -> sort -> paginate over allItems.
  const view = React.useMemo(() => {
    const filtered = allItems.filter((item) =>
      matchesShipmentDateRange(item, startDate, endDate),
    );
    const sorted =
      sort === "DEFAULT" ? filtered : sortItems(filtered, sort, SORT_ACCESSORS);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_LIMIT));
    const start = (page - 1) * PAGE_LIMIT;
    return {
      items: sorted.slice(start, start + PAGE_LIMIT),
      total: sorted.length,
      totalPages,
    };
  }, [allItems, startDate, endDate, sort, page]);

  // If filters shrink the result set below the current page, step back.
  React.useEffect(() => {
    if (page > view.totalPages) setPage(view.totalPages);
  }, [page, view.totalPages]);

  const hasDateFilter = Boolean(startDate || endDate);
  const hasActiveFilters = hasDateFilter || sort !== "DEFAULT";

  return {
    shipments: view.items,
    total: view.total,
    totalPages: view.totalPages,
    page,
    setPage,
    pageSize: PAGE_LIMIT,
    loading,
    error,
    notice,
    dismissNotice: () => setNotice(null),
    reload,
    searchInput,
    setSearchInput,
    statusFilter,
    updateStatusFilter,
    startDate,
    updateStartDate,
    endDate,
    updateEndDate,
    sort,
    updateSort,
    hasDateFilter,
    hasActiveFilters,
    clearDateFilter,
    createOpen,
    setCreateOpen,
    openCreateModal,
    closeStatusModal,
    statusTarget,
    setStatusTarget,
    handleCreated,
    handleStatusUpdated,
    viewShipment,
  };
}
