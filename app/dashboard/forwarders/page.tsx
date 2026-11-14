"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { Forwarder, ForwardersResponse } from "./_components/types";
import { ForwarderFilterBar } from "./_components/ForwarderFilterBar";
import { ForwarderTable } from "./_components/ForwarderTable";
import { CreateForwarderModal } from "./_components/CreateForwarderModal";
import { EditForwarderModal } from "./_components/EditForwarderModal";
import { DeleteForwarderModal } from "./_components/DeleteForwarderModal";

export default function ForwardersPage() {
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Forwarder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Forwarder | null>(null);

  // Fetch Forwarders Data
  const fetchForwarders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {
        page,
        limit,
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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchForwarders();
  }, [fetchForwarders]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // Reset page on filter/search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Forwarders Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage courier and logistics vendor accounts, contact channels, and
          status tracking.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
        {successMsg && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>

            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="rounded p-1 text-emerald-700 hover:bg-emerald-500/20"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded text-xs font-mono bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <ForwarderFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onOpenCreateModal={() => setCreateModalOpen(true)}
        />

        <ForwarderTable
          data={forwarders}
          loading={loading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={(forwarder) => setEditTarget(forwarder)}
          onDelete={(forwarder) => setDeleteTarget(forwarder)}
        />
      </div>

      {/* Modals */}
      <CreateForwarderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={(createdCompanyName) => {
          setSuccessMsg(
            `Forwarder "${createdCompanyName}" added successfully.`,
          );
          fetchForwarders();
        }}
      />

      <EditForwarderModal
        forwarder={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSuccess={() => {
          if (editTarget) {
            setSuccessMsg(
              `Forwarder "${editTarget.company_name}" updated successfully.`,
            );
          }
          fetchForwarders();
        }}
      />

      <DeleteForwarderModal
        forwarder={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={() => {
          if (deleteTarget) {
            setSuccessMsg(
              `Forwarder "${deleteTarget.company_name}" deleted successfully.`,
            );
          }
          fetchForwarders();
        }}
      />
    </div>
  );
}