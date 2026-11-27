"use client";

// State and data flow for the Shipments page.
// Owns the debounced search, status/date filters, client-side sort, the
// active+history merge with request-sequence guard, and modal state.
// Backend has no sort params, so sorting runs client-side on the merged set.

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  fetchActiveShipments,
  fetchShipmentHistory,
} from "./shipment-api";
import { Shipment, TrackingStatus } from "./shipment-types";
import { STATUS_LABELS } from "./shipment-utils";
import { SortKey, sortItems } from "@/lib/utils/sort";
import { getErrorMessage } from "@/lib/utils";

export type ShipmentFilter = "ALL" | TrackingStatus;

const PAGE_LIMIT = 15;

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

  const [statusFilter, setStatusFilter] = React.useState<ShipmentFilter>("ALL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("DEFAULT");
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
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
        const res = await fetchShipmentHistory({
          page: 1,
          limit: 100,
          search,
        });
        items = (res.items ?? []).filter((item) =>
          matchesShipmentDateRange(item, startDate, endDate),
        );
      } else if (statusFilter === "PENDING" || statusFilter === "DISPATCHED") {
        // Fetch active shipments (PENDING + DISPATCHED) and filter to the selected status
        const res = await fetchActiveShipments({
          page: 1,
          limit: 100,
          search,
        });
        items = (res.items ?? []).filter(
          (item) =>
            item.tracking_status === statusFilter &&
            matchesShipmentDateRange(item, startDate, endDate),
        );
      } else {
        // statusFilter === "ALL": combine active (PENDING/DISPATCHED) and history (DELIVERED)
        const [activeRes, historyRes] = await Promise.all([
          fetchActiveShipments({ page: 1, limit: 100, search }),
          fetchShipmentHistory({ page: 1, limit: 100, search }),
        ]);
        items = [
          ...(activeRes.items ?? []),
          ...(historyRes.items ?? []),
        ].filter((item) => matchesShipmentDateRange(item, startDate, endDate));
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
    router.push(`/dashboard/forwarders/shipments/view/${shipment.id}`);
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
