"use client";

import * as React from "react";
import { DeliveryHistoryTable } from "./_components/DeliveryHistoryTable";
import { ReceiveDeliveryModal } from "./_components/ReceiveDeliveryModal";
import { DeliveryDetailViewModal } from "./_components/DeliveryDetailViewModal";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { fetchDeliveries } from "@/lib/inventory/delivery-api";
import { DeliveryRecord } from "@/lib/inventory/delivery-types";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { canManageStock } from "@/lib/auth/permissions";
import { getErrorMessage } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/components/ui/pageheader";

export default function DeliveriesPage() {
  const role = useCurrentRole();
  const [deliveries, setDeliveries] = React.useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<{
    message: string;
    isPartial: boolean;
  } | null>(null);

  // Filters & Sort
  const [sort, setSort] = React.useState<SortKey>("DEFAULT");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Pagination
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(15);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Selected delivery for Detail View Modal
  const [selectedDeliveryId, setSelectedDeliveryId] = React.useState<
    number | null
  >(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

  const loadDeliveries = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchDeliveries({ page, limit });

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
  }, [page, limit]);

  React.useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [sort, startDate, endDate]);

  // Auto-dismiss success banner after 4 seconds
  React.useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const displayedDeliveries = React.useMemo(() => {
    const startTs = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : null;
    const endTs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;

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

  return (
    <div className="flex-1 space-y-6 font-sans">
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="Deliveries"
          subheader="Record incoming stock from suppliers and match deliveries against Purchase Orders."
        />
      </div>

      {/* Main Content Card Container */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        {/* Actions & Filter Bar: Sort -> Date Range -> Refresh on the left, Receive Delivery on the right */}
        <div className="space-y-3">
          {successBanner && (
            <div
              role="status"
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs animate-in fade-in duration-200 ${
                successBanner.isPartial
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-800"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {successBanner.isPartial ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <span>
                  {successBanner.message}
                  {successBanner.isPartial && (
                    <span className="ml-1 font-semibold">
                      (PO marked as partially fulfilled.)
                    </span>
                  )}
                </span>
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSuccessBanner(null)}
                className={`h-6 px-2 ${
                  successBanner.isPartial
                    ? "text-amber-800 hover:bg-amber-500/20 hover:text-amber-950"
                    : "text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-900"
                }`}
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <SortSelect
                value={sort}
                onChange={setSort}
                showDefaultOption
                options={["DATE_DESC", "DATE_ASC"]}
                triggerClassName="w-[170px] !h-9 text-xs rounded-[2px]"
              />

              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                inputClassName="h-9 w-[135px]"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadDeliveries}
                disabled={loading}
                className="rounded-[2px] gap-1.5 text-xs h-9 hover:bg-muted shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-2.5 text-xs rounded-[2px] text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {canManageStock(role) && (
              <div className="ml-auto">
                <ReceiveDeliveryModal
                  onSuccess={(info) => {
                    setSuccessBanner(info);
                    if (page === 1) loadDeliveries();
                    else setPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md break-words">
            {error}
          </div>
        )}

        {/* Deliveries Table */}
        <DeliveryHistoryTable
          deliveries={displayedDeliveries}
          loading={loading}
          onViewDetails={handleViewDetails}
          page={page}
          totalPages={hasActiveFilters ? 1 : totalPages}
          total={hasActiveFilters ? displayedDeliveries.length : total}
          pageSize={limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Delivery Details Modal */}
      <DeliveryDetailViewModal
        deliveryId={selectedDeliveryId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}