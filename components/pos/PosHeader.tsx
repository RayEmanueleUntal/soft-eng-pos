"use client";

import { ShoppingCart, User, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPeso, usePosCustomers, type PosCustomer } from "@/lib/pos";

interface PosHeaderProps {
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  customers?: PosCustomer[];
  loading?: boolean;
}

export function PosHeader({
  selectedCustomerId,
  onSelectCustomer,
  customers: externalCustomers,
  loading: externalLoading,
}: PosHeaderProps) {
  // If customers are passed from parent page, use them; otherwise fetch directly
  const hookData = usePosCustomers();
  const customers = externalCustomers ?? hookData.customers;
  const loading = externalLoading ?? hookData.loading;

  const selectedCustomerData = customers.find(
    (c) => String(c.id) === String(selectedCustomerId)
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border bg-card shrink-0">
      <div>
        <h1 className="text-[24px] font-heading font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          POS Terminal
        </h1>
      </div>

      {/* Customer Selector */}
      <div className="flex items-center gap-2.5 bg-card p-2 rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="text-xs font-sans">
          <span className="text-muted-foreground block">Customer</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            disabled={loading}
            className="font-medium text-foreground bg-transparent focus:outline-none cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name} ({c.type === "WHOLESALE" ? "Wholesale" : "Retail"}){" "}
                {c.type === "WHOLESALE" && c.creditLimit > 0
                  ? `[Credit: ${formatPeso(c.creditLimit)}]`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedCustomerData && (
          <Badge
            variant={
              selectedCustomerData.type === "WHOLESALE"
                ? "default"
                : "secondary"
            }
            className="rounded-[2px] font-mono text-[11px]"
          >
            {selectedCustomerData.type === "WHOLESALE" ? "Wholesale" : "Retail"}
          </Badge>
        )}
      </div>
    </div>
  );
}
