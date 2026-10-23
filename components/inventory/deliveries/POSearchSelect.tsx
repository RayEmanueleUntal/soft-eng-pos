"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrder } from "@/lib/inventory/delivery-types";
import { fetchPurchaseOrders } from "@/lib/inventory/delivery-api";
import { Search, Loader2, Check, ArrowRight, RefreshCw } from "lucide-react";

interface POSearchSelectProps {
  onSelectPO: (po: PurchaseOrder) => void;
  selectedPOId: number | null;
}

export function POSearchSelect({ onSelectPO, selectedPOId }: POSearchSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPOs = React.useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const data = await fetchPurchaseOrders({
        search: searchQuery || undefined,
        status: "ACTIVE", // Or fetch open POs
      });
      setPurchaseOrders(data);
      setHasSearched(true);
    } catch (err) {
      console.error("Failed to load POs:", err);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPOs(debouncedSearch);
  }, [debouncedSearch, loadPOs]);

  // Client-side filter to support matching by PO ID, Supplier Name, or Product SKU
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm.trim()) return purchaseOrders;
    const term = searchTerm.toLowerCase();

    return purchaseOrders.filter((po) => {
      const matchId = String(po.id).includes(term) || (po.poNumber || "").toLowerCase().includes(term);
      const matchSupplier = (po.supplierName || "").toLowerCase().includes(term);
      const matchSku = po.items.some(
        (i) =>
          (i.productSku || "").toLowerCase().includes(term) ||
          (i.productName || "").toLowerCase().includes(term),
      );
      return matchId || matchSupplier || matchSku;
    });
  }, [purchaseOrders, searchTerm]);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO #, Supplier name, or Product SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-md"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => loadPOs(debouncedSearch)}
          className="h-9 px-3 text-xs rounded-md"
          title="Refresh POs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* PO Results List */}
      <div className="max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border bg-card">
        {loading ? (
          <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Finding matching Purchase Orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {hasSearched
              ? "No active Purchase Orders found matching your query."
              : "No active Purchase Orders available."}
          </div>
        ) : (
          filteredOrders.map((po) => {
            const isSelected = selectedPOId === po.id;
            return (
              <div
                key={po.id}
                onClick={() => onSelectPO(po)}
                className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "hover:bg-accent/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">
                      PO #{po.id} {po.poNumber ? `(${po.poNumber})` : ""}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-sm font-mono text-[10px] uppercase font-semibold text-primary border-primary/30"
                    >
                      {po.status || "ACTIVE"}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex gap-3 text-[11px]">
                    <span>
                      Supplier:{" "}
                      <strong className="text-foreground font-medium">
                        {po.supplierName || `ID #${po.supplierId}`}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{po.items.length} line item(s)</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {isSelected ? (
                    <span className="flex items-center gap-1 font-semibold text-primary text-xs">
                      <Check className="h-4 w-4" /> Selected
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs rounded-md text-muted-foreground hover:text-foreground"
                    >
                      Select <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

