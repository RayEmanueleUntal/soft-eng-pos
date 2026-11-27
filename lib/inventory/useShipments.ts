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
  // are applied on top of this without refetching. In server-paginated mode
  // (Delivered + no date filter + default sort) this holds only the visible
  // page and serverTotal/serverTotalPages carry the real totals.
  const [allItems, setAllItems] = React.useState<Shipment[]>([]);
  const [serverTotal, setServerTotal] = React.useState(0);
  const [serverTotalPages, setServerTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Shipment | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const requestId = React.useRef(0);
  // Key of the last completed client-mode fetch; page/sort/date-only changes
  // reuse the cached set instead of refetching.
  const clientFetchKey = React.useRef("");
  // Last query string this hook wrote to the URL, used to tell its own
  // router.replace echo apart from external navigation.
  const lastWrittenUrl = React.useRef<string | null>(null);

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
  // drops the query string). The search draft is only overwritten on external
  // navigation — the hook's own router.replace echo must not clobber typing
  // (e.g. "LBC " would lose its trailing space mid-search).
  React.useEffect(() => {
    const qs = searchParams.toString();
    const currentUrl = qs ? `${pathname}?${qs}` : pathname;
    const isOwnEcho = lastWrittenUrl.current === currentUrl;

    setStatusFilter(parseStatusParam(searchParams.get("status")));
    setStartDate(searchParams.get("from") ?? "");
    setEndDate(searchParams.get("to") ?? "");
    setSort(parseSortParam(searchParams.get("sort")));
    setPage(parsePageParam(searchParams.get("page")));

    if (!isOwnEcho) {
      const q = searchParams.get("q") ?? "";
      setSearchInput(q);
      setSearch(q.trim());
    }
  }, [searchParams, pathname]);

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
    const url = buildListQuery();
    lastWrittenUrl.current = url;
    router.replace(url, { scroll: false });
  }, [buildListQuery, router]);

  const hasDateFilter = Boolean(startDate || endDate);
  // Fast path: Delivered + no date filter + default sort can use the
  // backend's own pagination instead of downloading the full history.
  const serverPaginated =
    statusFilter === "DELIVERED" && !hasDateFilter && sort === "DEFAULT";

  // Page of the rows currently in allItems while server-paginated; used to
  // detect when a failed page fetch would leave stale rows under a new page.
  const loadedPageRef = React.useRef(1);

  // Loads shipment data. In server-paginated mode only the visible page is
  // fetched (page is a dependency). In client mode the full match set is
  // fetched once per statusFilter/search/reload — page, date, and sort
  // changes reuse the cache via clientFetchKey instead of refetching.
  // The cache key is only recorded after a successful response, and a cache
  // hit invalidates any pending request — it belongs to a different query
  // (e.g. a search the user cleared) and must not overwrite the cached rows
  // or leave its error visible.
  React.useEffect(() => {
    const handleError = (err: unknown, requestedPage: number) => {
      console.error("Failed to load shipments:", err);
      setError(
        getErrorMessage(
          err,
          "Failed to load shipments. Please check your connection.",
        ),
      );
      // Keep previous rows for a failed refresh of the same page, but clear
      // them when the failed request was for a different page — otherwise
      // stale rows would appear under the newly selected page number.
      if (serverPaginated && requestedPage !== loadedPageRef.current) {
        setAllItems([]);
      }
      setLoading(false);
    };

    if (serverPaginated) {
      const current = ++requestId.current;
      setLoading(true);
      setError(null);
      // Coming from client mode: allItems holds the full unpaged set, not a
      // server page, so no loaded page can be claimed until the first
      // server response lands.
      if (clientFetchKey.current !== "") {
        clientFetchKey.current = "";
        loadedPageRef.current = -1;
      }
      fetchShipmentHistory({ page, limit: PAGE_LIMIT, search })
        .then((res) => {
          if (current !== requestId.current) return;
          setAllItems(res.items ?? []);
          setServerTotal(res.meta?.totalItems ?? 0);
          setServerTotalPages(res.meta?.totalPages ?? 1);
          loadedPageRef.current = page;
          setLoading(false);
        })
        .catch((err) => {
          if (current !== requestId.current) return;
          handleError(err, page);
        });
      return;
    }

    const key = `${statusFilter}|${search}|${reloadKey}`;
    if (clientFetchKey.current === key) {
      // Cache hit: keep the cached rows but invalidate any pending request —
      // it belongs to a different query (e.g. a search the user cleared) and
      // must not overwrite them or leave its error visible.
      requestId.current += 1;
      setLoading(false);
      setError(null);
      return;
    }

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
        clientFetchKey.current = key;
        setAllItems(items);
        setLoading(false);
      })
      .catch((err) => {
        if (current !== requestId.current) return;
        handleError(err, page);
      });
  }, [statusFilter, search, reloadKey, serverPaginated, page]);

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
  // In server-paginated mode allItems is already the visible page.
  const view = React.useMemo(() => {
    if (serverPaginated) {
      return {
        items: allItems,
        total: serverTotal,
        totalPages: Math.max(1, serverTotalPages),
      };
    }
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
  }, [
    allItems,
    startDate,
    endDate,
    sort,
    page,
    serverPaginated,
    serverTotal,
    serverTotalPages,
  ]);

  // If filters shrink the result set below the current page, step back.
  // Skipped while loading so an empty pre-fetch result cannot reset a
  // URL-restored page and invalidate the pending request.
  React.useEffect(() => {
    if (loading) return;
    if (page > view.totalPages) setPage(view.totalPages);
  }, [page, view.totalPages, loading]);

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
