"use client";

// State and data flow for the Suppliers list page.
// Owns fetching, filters, pagination, modal targets, and the feedback banner.

import { useCallback, useEffect, useState } from "react";
import {
  Supplier,
  SupplierFormData,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./suppliers";
import { SortKey } from "@/components/ui/sort-select";
import { mapSupplierSortKeyToApiParams } from "@/lib/utils/sort";

const PAGE_SIZE = 15;

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<SortKey>("DEFAULT");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = useCallback(
    (type: "success" | "error", message: string) => {
      setFeedback({ type, message });
    },
    [],
  );

  // Auto-dismiss after 4 seconds (existing behavior preserved)
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const sortParams = mapSupplierSortKeyToApiParams(sortOrder);
      const res = await fetchSuppliers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm,
        status: statusFilter,
        ...sortParams,
      });
      setSuppliers(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err: any) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to load suppliers.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, sortOrder, showFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = useCallback(() => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  }, []);

  const openDeleteDialog = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSupplierToDelete(null);
  }, []);

  const handleCreateOrUpdate = async (data: SupplierFormData) => {
    try {
      setActionLoading(true);
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, data);
        showFeedback("success", "Supplier updated successfully.");
      } else {
        await createSupplier(data);
        showFeedback("success", "Supplier created successfully.");
      }
      closeModal();
      loadData();
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      setActionLoading(true);
      const res = await deleteSupplier(supplierToDelete.id);
      showFeedback(
        "success",
        res.message || "Supplier processed successfully.",
      );
      closeDeleteDialog();

      // If permanently deleted and it was the only item on a page > 1, step back a page
      if (!res.deactivated && suppliers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        loadData();
      }
    } catch (err: any) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to delete supplier.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    actionLoading,
    searchTerm,
    setSearchTerm: (v: string) => {
      setSearchTerm(v);
      setCurrentPage(1);
    },
    statusFilter,
    setStatusFilter: (v: string) => {
      setStatusFilter(v);
      setCurrentPage(1);
    },
    sortOrder,
    setSortOrder: (v: SortKey) => {
      setSortOrder(v);
      setCurrentPage(1);
    },
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageSize: PAGE_SIZE,
    isModalOpen,
    selectedSupplier,
    openCreateModal,
    openEditModal,
    closeModal,
    isDeleteDialogOpen,
    supplierToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    handleCreateOrUpdate,
    handleDelete,
    feedback,
    dismissFeedback: () => setFeedback(null),
    reload: loadData,
  };
}
