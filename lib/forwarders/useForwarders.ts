"use client";

// State and data flow for the Forwarders list page.
// Owns fetching, filters, pagination, modal targets, and the success banner.

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { Forwarder, ForwardersResponse } from "@/app/dashboard/forwarders/_components/types";
import { SortKey, mapForwarderSortKeyToApiParams } from "@/lib/utils/sort";

const PAGE_LIMIT = 15;

export function useForwarders() {
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("DEFAULT");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Forwarder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Forwarder | null>(null);

  // Auto-dismiss after 4 seconds (existing behavior preserved)
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const fetchForwarders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {
        page,
        limit: PAGE_LIMIT,
        ...mapForwarderSortKeyToApiParams(sort),
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (statusFilter === "active") {
        params.is_active = true;
      } else if (statusFilter === "inactive") {
        params.is_active = false;
      }

      const response = await apiClient.get<ForwardersResponse>("/forwarders", {
        params,
      });
      setForwarders(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotal(response.data.meta?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, sort]);

  useEffect(() => {
    fetchForwarders();
  }, [fetchForwarders]);

  // Filter changes reset to page 1
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSortChange = (nextSort: SortKey) => {
    setSort(nextSort);
    setPage(1);
  };

  const announce = (message: string) => setSuccessMsg(message);

  const handleCreated = (createdCompanyName: string) => {
    announce(`Forwarder "${createdCompanyName}" added successfully.`);
    fetchForwarders();
  };

  const handleUpdated = () => {
    if (editTarget) {
      announce(`Forwarder "${editTarget.company_name}" updated successfully.`);
    }
    fetchForwarders();
  };

  const handleDeleted = () => {
    if (deleteTarget) {
      announce(`Forwarder "${deleteTarget.company_name}" deleted successfully.`);
    }
    fetchForwarders();
  };

  const openCreateModal = () => setCreateModalOpen(true);
  const handleEditOpenChange = (open: boolean) => {
    if (!open) setEditTarget(null);
  };
  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setDeleteTarget(null);
  };

  return {
    forwarders,
    loading,
    error,
    successMsg,
    dismissSuccess: () => setSuccessMsg(null),
    searchQuery,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    sort,
    handleSortChange,
    page,
    setPage,
    totalPages,
    total,
    pageSize: PAGE_LIMIT,
    createModalOpen,
    setCreateModalOpen,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    fetchForwarders,
    handleCreated,
    handleUpdated,
    handleDeleted,
    openCreateModal,
    handleEditOpenChange,
    handleDeleteOpenChange,
  };
}
