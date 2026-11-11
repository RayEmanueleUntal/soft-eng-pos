// Shipments subpage of the POS inventory module (/dashboard/inventory/shipments).
// Active tab lists PENDING/DISPATCHED shipments (GET /shipments/active); History lists DELIVERED ones.
// Staff can log a shipment, move it through PENDING -> DISPATCHED -> DELIVERED, edit or cancel it.
"use client";

import * as React from "react";
import { CheckCircle2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/pageheader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Shipment } from "@/lib/inventory/shipment-types";
import { STATUS_LABELS } from "@/lib/inventory/shipment-utils";
import { getErrorMessage } from "@/lib/utils";

type ShipmentTab = "active" | "history";

const PAGE_LIMIT = 10;

export default function ShipmentsPage() {
  const role = useCurrentRole();

  const [tab, setTab] = React.useState<ShipmentTab>("active");
  const [activePage, setActivePage] = React.useState(1);
  const [historyPage, setHistoryPage] = React.useState(1);
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
  const page = tab === "active" ? activePage : historyPage;
  const setPage = tab === "active" ? setActivePage : setHistoryPage;

  // Applies the search box after a short pause and returns both tabs to page 1.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setActivePage(1);
      setHistoryPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Loads the current tab; ignores responses from requests that were superseded.
  React.useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    const request =
      tab === "active"
        ? fetchActiveShipments({ page, limit: PAGE_LIMIT, search })
        : fetchShipmentHistory({ page, limit: PAGE_LIMIT, search });

    request
      .then((res) => {
        if (current !== requestId.current) return;
        // The last item of the last page may have just left this list; step back one page.
        if (res.items.length === 0 && page > 1) {
          setPage(Math.max(1, Math.min(page - 1, res.meta.totalPages)));
          return;
        }
        setShipments(res.items ?? []);
        setTotal(res.meta?.totalItems ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
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
    // setPage is derived from `tab`, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, search, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const handleCreated = (shipment: Shipment) => {
    setNotice(
      `Shipment #${shipment.id} logged for ${
        shipment.transaction?.invoice_number ?? `order #${shipment.transactionId}`
      } (Pending).`,
    );
    setTab("active");
    setActivePage(1);
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

  return (
    <div className="flex-1 space-y-6 font-sans">
      <div className="shrink-0 mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          header="Shipments"
          subheader="Assign forwarders to completed orders and track delivery status."
        />

        {canCreateShipment(role) && (
          <Button
            onClick={() => {
              setNotice(null);
              setCreateOpen(true);
            }}
            className="h-8 gap-1.5 rounded-sm bg-primary px-3 text-xs font-semibold tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Shipment
          </Button>
        )}
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
        {/* Tabs, search and refresh */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as ShipmentTab)}
          >
            <TabsList>
              <TabsTrigger value="active" className="px-3">
                Active
              </TabsTrigger>
              <TabsTrigger value="history" className="px-3">
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search invoice or tracking no."
                className="h-9 pl-8 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="rounded-md gap-1.5 text-xs h-9 hover:bg-muted"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
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
            search
              ? "No shipments match your search."
              : tab === "active"
                ? 'No active shipments. Use "Log Shipment" to assign a forwarder to a completed order.'
                : "No delivered shipments yet."
          }
          canUpdate={canUpdateShipment(role)}
          onView={handleView}
          onUpdateStatus={setStatusTarget}
          page={page}
          totalPages={totalPages}
          total={total}
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