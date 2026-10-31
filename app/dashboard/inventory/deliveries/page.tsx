"use client";

import * as React from "react";
import { DeliveryHistoryTable } from "./_components/DeliveryHistoryTable";
import { ReceiveDeliveryModal } from "./_components/ReceiveDeliveryModal";
import { DeliveryDetailViewModal } from "./_components/DeliveryDetailViewModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchDeliveries } from "@/lib/inventory/delivery-api";
import { DeliveryRecord } from "@/lib/inventory/delivery-types";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { canManageStock } from "@/lib/auth/permissions";
import { Search, RefreshCw, Filter, Truck } from "lucide-react";

export default function DeliveriesPage() {
  const role = useCurrentRole();
  const [deliveries, setDeliveries] = React.useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [poFilter, setPoFilter] = React.useState<string>("");
  const [debouncedPoFilter, setDebouncedPoFilter] = React.useState<string>("");

  // Selected delivery for Detail View Modal
  const [selectedDeliveryId, setSelectedDeliveryId] = React.useState<
    number | null
  >(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

  // Debounce PO filter
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPoFilter(poFilter.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [poFilter]);

  const loadDeliveries = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const poIdNum = debouncedPoFilter
      ? parseInt(debouncedPoFilter, 10)
      : undefined;

    try {
      const res = await fetchDeliveries({
        page,
        limit,
        poId: Number.isNaN(poIdNum) ? undefined : poIdNum,
      });

      setDeliveries(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error("Failed to load deliveries:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load delivery logs. Please check your connection.",
      );
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedPoFilter]);

  React.useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleViewDetails = (deliveryId: number) => {
    setSelectedDeliveryId(deliveryId);
    setDetailModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-8 font-sans">
      {/* Page Header adhering to Customers/Suppliers reference standard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deliveries</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Record incoming stock from suppliers and match deliveries against
            Purchase Orders.
          </p>
        </div>

        {canManageStock(role) && (
          <ReceiveDeliveryModal onSuccess={loadDeliveries} />
        )}
      </div>

      {/* Main Content Card Container */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by PO ID #..."
              value={poFilter}
              onChange={(e) => setPoFilter(e.target.value)}
              className="pl-9 h-9 text-xs rounded-md font-mono"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDeliveries}
            disabled={loading}
            className="rounded-md gap-1.5 text-xs h-9 hover:bg-muted"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
            {error}
          </div>
        )}

        {/* Deliveries Table */}
        <DeliveryHistoryTable
          deliveries={deliveries}
          loading={loading}
          onViewDetails={handleViewDetails}
          page={page}
          totalPages={totalPages}
          total={total}
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
