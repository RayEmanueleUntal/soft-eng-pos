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
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
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

  // Auto-dismiss success banner after 4 seconds
  React.useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [successBanner]);

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

        {canManageStock(role) && (
          <ReceiveDeliveryModal
            onSuccess={(info) => {
              setSuccessBanner(info);
              if (page === 1) loadDeliveries();
              else setPage(1);
            }}
          />
        )}
      </div>

      {/* Main Content Card Container */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        {/* Actions Bar (Success banner beside Refresh button) */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex-1">
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
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDeliveries}
            disabled={loading}
            className="rounded-md gap-1.5 text-xs h-9 hover:bg-muted shrink-0 self-end sm:self-auto"
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