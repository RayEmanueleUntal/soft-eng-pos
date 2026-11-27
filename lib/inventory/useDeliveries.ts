"use client";

// State and data flow for the Deliveries (Receive Delivery) page.
// Owns fetching, date/sort filters, client-side filtering, and modal state.

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDeliveries } from "./delivery-api";
import { DeliveryRecord } from "./delivery-types";
import { SortKey } from "@/components/ui/sort-select";
import { mapDeliverySortKeyToApiParams } from "@/lib/utils/sort";
import { getErrorMessage } from "@/lib/utils";

const PAGE_LIMIT = 15;

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    message: string;
    isPartial: boolean;
  } | null>(null);

  const [sort, setSort] = useState<SortKey>("DEFAULT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { sortBy, sortOrder } = mapDeliverySortKeyToApiParams(sort);

      const res = await fetchDeliveries({
        page,
        limit: PAGE_LIMIT,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      });

      setDeliveries(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setError(
        getErrorMessage(
          err,
          "Failed to load delivery logs. Please check your connection.",
        ),
      );
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, startDate, endDate]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [sort, startDate, endDate]);

  // Auto-dismiss success banner after 4 seconds (existing behavior preserved)
  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const displayedDeliveries = useMemo(() => {
    const startTs = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : null;
    const endTs = endDate
      ? new Date(`${endDate}T23:59:59.999`).getTime()
      : null;

    const filtered = deliveries.filter((d) => {
      const rawDate =
        (d as any).delivery_date ??
        (d as any).received_at ??
        (d as any).created_at ??
        (d as any).createdAt;
      if (!rawDate) return !startTs && !endTs;
      const ts = new Date(rawDate).getTime();
      if (Number.isNaN(ts)) return true;
      if (startTs !== null && ts < startTs) return false;
      if (endTs !== null && ts > endTs) return false;
      return true;
    });

    if (sort === "DEFAULT") return filtered;

    return [...filtered].sort((a, b) => {
      const aTime = new Date(
        (a as any).delivery_date ??
          (a as any).received_at ??
          (a as any).created_at ??
          (a as any).createdAt ??
          0,
      ).getTime();
      const bTime = new Date(
        (b as any).delivery_date ??
          (b as any).received_at ??
          (b as any).created_at ??
          (b as any).createdAt ??
          0,
      ).getTime();

      switch (sort) {
        case "DATE_ASC":
          return aTime - bTime;
        case "DATE_DESC":
          return bTime - aTime;
        case "ID_ASC":
          return Number(a.id) - Number(b.id);
        case "ID_DESC":
          return Number(b.id) - Number(a.id);
        default:
          return 0;
      }
    });
  }, [deliveries, startDate, endDate, sort]);

  const hasActiveFilters = Boolean(startDate || endDate || sort !== "DEFAULT");

  const handleClearFilters = () => {
    setSort("DEFAULT");
    setStartDate("");
    setEndDate("");
  };

  const handleViewDetails = (deliveryId: number) => {
    setSelectedDeliveryId(deliveryId);
    setDetailModalOpen(true);
  };

  const handleReceiveSuccess = (info: {
    message: string;
    isPartial: boolean;
  }) => {
    setSuccessBanner(info);
    if (page === 1) loadDeliveries();
    else setPage(1);
  };

  return {
    deliveries: displayedDeliveries,
    loading,
    error,
    successBanner,
    dismissSuccessBanner: () => setSuccessBanner(null),
    sort,
    setSort,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    totalPages,
    total,
    pageSize: PAGE_LIMIT,
    hasActiveFilters,
    handleClearFilters,
    loadDeliveries,
    handleViewDetails,
    handleReceiveSuccess,
    selectedDeliveryId,
    detailModalOpen,
    setDetailModalOpen,
  };
}
