"use client";

import * as React from "react";
import { DeliveryHistoryTable } from "./_components/DeliveryHistoryTable";
import { ReceiveDeliveryModal } from "./_components/ReceiveDeliveryModal";
import { DeliveryDetailViewModal } from "./_components/DeliveryDetailViewModal";
import { Button } from "@/components/ui/button";
import { fetchDeliveries } from "@/lib/inventory/delivery-api";
import { DeliveryRecord } from "@/lib/inventory/delivery-types";
import { useCurrentRole } from "@/lib/auth/use-current-role";
import { canManageStock } from "@/lib/auth/permissions";
import { getErrorMessage } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/pageheader";

export default function DeliveriesPage() {
  const role = useCurrentRole();
  const [deliveries, setDeliveries] = React.useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
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

  const handleViewDetails = (deliveryId: number) => {
    setSelectedDeliveryId(deliveryId);
    setDetailModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 font-sans">
      {/* Page Header */}
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
      </div> */}

      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="Deliveries"
          subheader="Record incoming stock from suppliers and match deliveries against
            Purchase Orders."
        />

        {canManageStock(role) && (
          <ReceiveDeliveryModal onSuccess={loadDeliveries} />
        )}
      </div>

      {/* Main Content Card Container */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        {/* Actions Bar (no search: GET /deliveries does not support it) */}
        <div className="flex justify-end items-center">
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
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md break-words">
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
