"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingCart, User, Loader2, Search, Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const hookData = usePosCustomers();
  const customers = externalCustomers ?? hookData.customers;
  const loading = externalLoading ?? hookData.loading;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCustomerData = customers.find(
    (c) => String(c.id) === String(selectedCustomerId)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter customers by search term
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border bg-card shrink-0">
      <div>
        <h1 className="text-[24px] font-heading font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          POS Terminal
        </h1>
      </div>

      {/* Searchable Customer Selector */}
      <div className="relative" ref={containerRef}>
        <div
          onClick={() => !loading && setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-card p-2 rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)] cursor-pointer hover:border-primary transition-colors min-w-[260px]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}

          <div className="text-xs font-sans flex-1 overflow-hidden">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Customer
            </span>
            <div className="font-medium text-foreground truncate">
              {selectedCustomerData
                ? `${selectedCustomerData.name} (${selectedCustomerData.type === "WHOLESALE" ? "Wholesale" : "Retail"})`
                : "Select Customer..."}
            </div>
          </div>

          {selectedCustomerData && (
            <Badge
              variant={selectedCustomerData.type === "WHOLESALE" ? "default" : "secondary"}
              className="rounded-sm text-[10px]"
            >
              {selectedCustomerData.type === "WHOLESALE" ? "Wholesale" : "Retail"}
            </Badge>
          )}

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        </div>

        {/* Dropdown Menu with Search Input */}
        {isOpen && (
          <div className="absolute right-0 mt-1 w-80 bg-popover border border-border rounded-md shadow-lg z-50 p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customer by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
              {filteredCustomers.length === 0 ? (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  No customer found.
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = String(c.id) === String(selectedCustomerId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(String(c.id));
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`flex items-center justify-between p-2 text-xs rounded-sm cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.type === "WHOLESALE"
                            ? `Wholesale ${c.creditLimit > 0 ? `• Credit Limit: ${formatPeso(c.creditLimit)}` : ""}`
                            : "Retail"}
                        </span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}