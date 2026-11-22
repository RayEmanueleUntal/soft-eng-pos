// Shipments subpage of the POS inventory module (/dashboard/inventory/shipments).
// Staff can log a shipment, move it through PENDING -> DISPATCHED -> DELIVERED, edit or cancel it.
"use client";

import * as React from "react";
import { CheckCircle2, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/pageheader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateShipmentModal } from "./_components/CreateShipmentModal";
import { ShipmentDetailDrawer } from "./_components/ShipmentDetailDrawer";
import { ShipmentTable } from "./_components/ShipmentTable";
import { UpdateShipmentStatusModal } from "./_components/UpdateShipmentStatusModal";
import {
  canCreateShipment,
  canDeleteShipment,
  canUpdateShipment,
} from "@/lib/auth/permissions";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import {
  fetchActiveShipments,
  fetchShipmentHistory,
} from "@/lib/inventory/shipment-api";
import { Shipment, TrackingStatus } from "@/lib/inventory/shipment-types";
import { STATUS_LABELS } from "@/lib/inventory/shipment-utils";
import { getErrorMessage } from "@/lib/utils";

type ShipmentFilter = "ALL" | TrackingStatus;

const FILTER_LABELS: Record<ShipmentFilter, string> = {
  ALL: "All Status",
  PENDING: "Pending",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

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

export default function ShipmentsPage() {
  const role = useCurrentRole();

  const [statusFilter, setStatusFilter] = React.useState<ShipmentFilter>("ALL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
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
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
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

  // Loads shipments for the active status filter; ignores superseded responses.
  React.useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    const hasDateFilter = Boolean(startDate || endDate);

    const load = async () => {
      if (statusFilter === "DELIVERED") {
        if (hasDateFilter) {
          const res = await fetchShipmentHistory({
            page: 1,
            limit: 100,
            search,
          });
          const filtered = (res.items ?? []).filter((item) =>
            matchesShipmentDateRange(item, startDate, endDate),
          );
          const computedTotalPages = Math.max(
            1,
            Math.ceil(filtered.length / PAGE_LIMIT),
          );
          const start = (page - 1) * PAGE_LIMIT;
          return {
            items: filtered.slice(start, start + PAGE_LIMIT),
            totalItems: filtered.length,
            totalPages: computedTotalPages,
          };
        }

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

      if (statusFilter === "PENDING" || statusFilter === "DISPATCHED") {
        // Fetch active shipments (PENDING + DISPATCHED) and filter to the selected status
        const res = await fetchActiveShipments({
          page: 1,
          limit: 100,
          search,
        });
        const filtered = (res.items ?? []).filter(
          (item) =>
            item.tracking_status === statusFilter &&
            matchesShipmentDateRange(item, startDate, endDate),
        );
        const computedTotalPages = Math.max(
          1,
          Math.ceil(filtered.length / PAGE_LIMIT),
        );
        const start = (page - 1) * PAGE_LIMIT;
        return {
          items: filtered.slice(start, start + PAGE_LIMIT),
          totalItems: filtered.length,
          totalPages: computedTotalPages,
        };
      }

      // statusFilter === "ALL": combine active (PENDING/DISPATCHED) and history (DELIVERED)
      const [activeRes, historyRes] = await Promise.all([
        fetchActiveShipments({ page: 1, limit: 100, search }),
        fetchShipmentHistory({ page: 1, limit: 100, search }),
      ]);
      const combined = [
        ...(activeRes.items ?? []),
        ...(historyRes.items ?? []),
      ].filter((item) => matchesShipmentDateRange(item, startDate, endDate));
      const computedTotalPages = Math.max(
        1,
        Math.ceil(combined.length / PAGE_LIMIT),
      );
      const start = (page - 1) * PAGE_LIMIT;
      return {
        items: combined.slice(start, start + PAGE_LIMIT),
        totalItems: combined.length,
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
  }, [statusFilter, startDate, endDate, page, search, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

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

  const handleView = (shipment: Shipment) => {
    setDetailId(shipment.id);
    setDetailOpen(true);
  };

  // Closes the drawer first so only one dialog is open at a time.
  const handleStartStatusUpdate = (shipment: Shipment) => {
    setDetailOpen(false);
    setStatusTarget(shipment);
  };

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="flex-1 space-y-6 font-sans">
      <div className="shrink-0 mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          header="Shipments"
          subheader="Assign forwarders to completed orders and track delivery status."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2.5">
            {/* Search */}
            <div className="flex flex-col gap-2 min-w-[220] flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search invoice or tracking no."
                  className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter((value ?? "ALL") as ShipmentFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="!h-9 w-[150px] text-sm rounded-[4px]">
                  <SelectValue placeholder="All Status">
                    {FILTER_LABELS[statusFilter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(val) => {
                setStartDate(val);
                setPage(1);
              }}
              onEndDateChange={(val) => {
                setEndDate(val);
                setPage(1);
              }}
              inputClassName="h-9 w-[135px]"
            />

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="h-9 px-2.5 text-xs rounded-[4px] gap-1.5 hover:bg-muted shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {hasDateFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="h-9 px-2.5 text-xs rounded-[4px] text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}

            {/* Log Shipment Button (Furthest Right) */}
            {canCreateShipment(role) && (
              <div className="ml-auto shrink-0">
                <Button
                  onClick={() => {
                    setNotice(null);
                    setCreateOpen(true);
                  }}
                  className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Log Shipment
                </Button>
              </div>
            )}
          </div>
        </div>

        {notice && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-600/30 bg-emerald-600/10 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{notice}</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md break-words">
            {error}
          </div>
        )}

        <ShipmentTable
          shipments={shipments}
          loading={loading}
          emptyMessage={
            search || hasDateFilter
              ? "No shipments match your filters."
              : statusFilter === "DELIVERED"
                ? "No delivered shipments yet."
                : 'No shipments found. Use "Log Shipment" to assign a forwarder to a completed order.'
          }
          canUpdate={canUpdateShipment(role)}
          onView={handleView}
          onUpdateStatus={setStatusTarget}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_LIMIT}
          onPageChange={setPage}
        />
      </div>

      <CreateShipmentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <ShipmentDetailDrawer
        shipmentId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canUpdate={canUpdateShipment(role)}
        canDelete={canDeleteShipment(role)}
        onUpdateStatus={handleStartStatusUpdate}
        onChanged={reload}
      />

      <UpdateShipmentStatusModal
        shipment={statusTarget}
        onClose={() => setStatusTarget(null)}
        onUpdated={handleStatusUpdated}
      />
    </div>
  );
}