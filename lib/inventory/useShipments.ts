"use client";

// State and data flow for the Shipments page.
// Owns the debounced search, status/date filters, client-side sort, the
// active+history merge with request-sequence guard, and modal state.
// Backend has no sort params, so sorting runs client-side on the merged set.

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

export function useShipments() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // List settings live in the URL so returning from the detail page restores them.
  const [statusFilter, setStatusFilter] = React.useState<ShipmentFilter>(() => {
    const value = searchParams.get("status");
    return SHIPMENT_STATUS_FILTERS.includes(value as ShipmentFilter)
      ? (value as ShipmentFilter)
      : "ALL";
  });
  const [startDate, setStartDate] = React.useState(
    () => searchParams.get("from") ?? "",
  );
  const [endDate, setEndDate] = React.useState(
    () => searchParams.get("to") ?? "",
  );
  const [sort, setSort] = React.useState<SortKey>(() => {
    const value = searchParams.get("sort");
    return SHIPMENT_SORTS.includes(value as SortKey)
      ? (value as SortKey)
      : "DEFAULT";
  });
  const [page, setPage] = React.useState(() => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  const [searchInput, setSearchInput] = React.useState(
    () => searchParams.get("q") ?? "",
  );
  const [search, setSearch] = React.useState(
    () => (searchParams.get("q") ?? "").trim(),
  );
  const [reloadKey, setReloadKey] = React.useState(0);

  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Shipment | null>(null);

  const requestId = React.useRef(0);

  // Applies the search box after a short pause and resets to page 1.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  // Loads shipments for the active filters; ignores superseded responses.
  React.useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    const hasDateFilter = Boolean(startDate || endDate);

    const sortAccessors = {
      getDate: (s: Shipment) => s.dispatch_date,
      getId: (s: Shipment) => s.id,
    };

    const load = async () => {
      let items: Shipment[] = [];

      if (
        statusFilter === "DELIVERED" &&
        !hasDateFilter &&
        sort === "DEFAULT"
      ) {
        // Fast path: server-paginated history, backend's own ordering.
        const res = await fetchShipmentHistory({
          page,
          limit: PAGE_LIMIT,
          search,
        });
        return {
          items: res.items ?? [],
          totalItems: res.meta?.totalItems ?? 0,
          totalPages: res.meta?.totalPages ?? 1,
        };
      }

      if (statusFilter === "DELIVERED") {
        items = (
          await fetchAllShipmentPages((p) =>
            fetchShipmentHistory({
              page: p,
              limit: FETCH_LIMIT,
              search,
            }),
          )
        ).filter((item) => matchesShipmentDateRange(item, startDate, endDate));
      } else if (statusFilter === "PENDING" || statusFilter === "DISPATCHED") {
        // Fetch active shipments (PENDING + DISPATCHED) and filter to the selected status
        items = (
          await fetchAllShipmentPages((p) =>
            fetchActiveShipments({
              page: p,
              limit: FETCH_LIMIT,
              search,
            }),
          )
        ).filter(
          (item) =>
            item.tracking_status === statusFilter &&
            matchesShipmentDateRange(item, startDate, endDate),
        );
      } else {
        // statusFilter === "ALL": combine active (PENDING/DISPATCHED) and history (DELIVERED)
        const [activeItems, historyItems] = await Promise.all([
          fetchAllShipmentPages((p) =>
            fetchActiveShipments({ page: p, limit: FETCH_LIMIT, search }),
          ),
          fetchAllShipmentPages((p) =>
            fetchShipmentHistory({ page: p, limit: FETCH_LIMIT, search }),
          ),
        ]);
        items = [...activeItems, ...historyItems].filter((item) =>
          matchesShipmentDateRange(item, startDate, endDate),
        );
      }

      const sorted =
        sort === "DEFAULT" ? items : sortItems(items, sort, sortAccessors);
      const computedTotalPages = Math.max(
        1,
        Math.ceil(sorted.length / PAGE_LIMIT),
      );
      const start = (page - 1) * PAGE_LIMIT;
      return {
        items: sorted.slice(start, start + PAGE_LIMIT),
        totalItems: sorted.length,
        totalPages: computedTotalPages,
      };
    };

    load()
      .then((res) => {
        if (current !== requestId.current) return;
        if (res.items.length === 0 && page > 1) {
          setPage(Math.max(1, Math.min(page - 1, res.totalPages)));
          return;
        }
        setShipments(res.items);
        setTotal(res.totalItems);
        setTotalPages(res.totalPages);
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
        setShipments([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [statusFilter, startDate, endDate, sort, page, search, reloadKey]);

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

  const hasDateFilter = Boolean(startDate || endDate);
  const hasActiveFilters = hasDateFilter || sort !== "DEFAULT";

  return {
    shipments,
    total,
    totalPages,
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
