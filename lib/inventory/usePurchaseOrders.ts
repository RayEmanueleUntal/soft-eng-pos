"use client";

// State and data flow for the Purchase Orders page.
// Owns fetching, filters, pagination, notices, and modal targets.

import { useCallback, useEffect, useState } from "react";
import { fetchPurchaseOrderList } from "./purchase-order-api";
import {
  POStatus,
  PurchaseOrderDto,
} from "./purchase-order-types";
import { SortKey } from "@/components/ui/sort-select";
import { mapPurchaseOrderSortKeyToApiParams } from "@/lib/utils/sort";
import { getErrorMessage } from "@/lib/utils";

const PAGE_LIMIT = 15;

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<POStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<SortKey>("DEFAULT");

  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] =
    useState<PurchaseOrderDto | null>(null);

  const [notice, setNotice] = useState<{
    message: string;
    variant: "success" | "cancelled";
  } | null>(null);

  // Auto-dismiss after 4 seconds (existing behavior preserved)
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Loads the current page of purchase orders for the active filters.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { sortBy, sortOrder } = mapPurchaseOrderSortKeyToApiParams(sort);

      const response = await fetchPurchaseOrderList({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      setOrders(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load purchase orders."));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate, sort]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter changes reset to page 1
  const updateStatusFilter = useCallback((val: POStatus | "ALL") => {
    setStatusFilter(val);
    setPage(1);
  }, []);
  const updateStartDate = useCallback((val: string) => {
    setStartDate(val);
    setPage(1);
  }, []);
  const updateEndDate = useCallback((val: string) => {
    setEndDate(val);
    setPage(1);
  }, []);
  const updateSort = useCallback((val: SortKey) => {
    setSort(val);
    setPage(1);
  }, []);

  // Closes the create dialog, announces the new PO (green) and reloads the list.
  const handleCreated = (order: PurchaseOrderDto) => {
    setCreateOpen(false);
    setNotice({
      message: `Purchase order #${order.id} created.`,
      variant: "success",
    });
    if (page === 1) loadOrders();
    else setPage(1);
  };

  // Closes the cancel dialog, announces the result (red) and reloads the list.
  const handleCancelled = (order: PurchaseOrderDto) => {
    setCancelTarget(null);
    setNotice({
      message: `Purchase order #${order.id} cancelled.`,
      variant: "cancelled",
    });
    loadOrders();
  };

  const openCreateModal = () => setCreateOpen(true);
  const closeCancelDialog = () => setCancelTarget(null);

  return {
    orders,
    loading,
    error,
    page,
    setPage,
    totalPages,
    total,
    pageSize: PAGE_LIMIT,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    startDate,
    setStartDate: updateStartDate,
    endDate,
    setEndDate: updateEndDate,
    sort,
    setSort: updateSort,
    createOpen,
    setCreateOpen,
    cancelTarget,
    setCancelTarget,
    notice,
    dismissNotice: () => setNotice(null),
    loadOrders,
    handleCreated,
    handleCancelled,
    openCreateModal,
    closeCancelDialog,
  };
}
