"use client";

import { ShoppingCart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPeso } from "@/lib/pos/format-currency";
import { mockCustomers } from "@/lib/customers/mock-data";

interface PosHeaderProps {
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
}

export function PosHeader({
  selectedCustomerId,
  onSelectCustomer,
}: PosHeaderProps) {
  const selectedCustomerData = mockCustomers.find(
    (c) => c.id === selectedCustomerId
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
        <User className="h-4 w-4 text-muted-foreground" />
        <div className="text-xs font-sans">
          <span className="text-muted-foreground block">Customer</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            className="font-medium text-foreground bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="">Walk-in Retail Customer</option>
            {mockCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type}){" "}
                {c.type === "Wholesale"
                  ? `[Credit: ${formatPeso(c.creditLimit)}]`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedCustomerData && (
          <Badge
            variant={
              selectedCustomerData.type === "Wholesale"
                ? "default"
                : "secondary"
            }
            className="rounded-sm"
          >
            {selectedCustomerData.type}
          </Badge>
        )}
      </div>
    </div>
  );
}
