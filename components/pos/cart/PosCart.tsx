"use client";

import {
  Trash2,
  Check,
  Loader2,
  User,
  Search,
  ChevronDown,
  Plus,
} from "lucide-react";
import type { PaymentModalItem } from "../payment/PaymentModal";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";
import { formatPeso, usePosCustomers, type PosCustomer } from "@/lib/pos";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { AddCustomerModal } from "@/components/profiles/customers/AddCustomerModal";

import { Button } from "@/components/ui/button";

interface PosCartProps {
  cart: PaymentModalItem[];
  cartTotal: number;
  onUpdateQuantity: (
    productId: string | number | undefined,
    delta: number,
  ) => void;
  onClearCart: () => void;

  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  customers?: PosCustomer[];
  loading?: boolean;
}

export function PosCart({
  cart,
  cartTotal,
  onUpdateQuantity,
  onClearCart,
  selectedCustomerId,
  onSelectCustomer,
  customers: externalCustomers,
  loading: externalLoading,
}: PosCartProps) {
  const hookData = usePosCustomers();
  const customers = externalCustomers ?? hookData.customers;
  const loading = externalLoading ?? hookData.loading;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const selectedCustomerData = customers.find(
    (c) => String(c.id) === String(selectedCustomerId),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="lg:col-span-4 flex h-full flex-col rounded-[4px] overflow-hidden gap-3 ">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1 min-w-0" ref={containerRef}>
          <div
            onClick={() => !loading && setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-card p-2 rounded-[4px] border border-input cursor-pointer hover:border-primary transition-colors w-full overflow-hidden"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}

            <div className="text-xs font-sans flex-1 min-w-0  overflow-hidden">
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
                variant={
                  selectedCustomerData.type === "WHOLESALE"
                    ? "default"
                    : "secondary"
                }
                className="rounded-sm text-[10px] shrink-0"
              >
                {selectedCustomerData.type === "WHOLESALE"
                  ? "Wholesale"
                  : "Retail"}
              </Badge>
            )}

            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1 shrink-0" />
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
                    const isSelected =
                      String(c.id) === String(selectedCustomerId);
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
                          <span className="font-medium text-foreground">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.type === "WHOLESALE"
                              ? `Wholesale ${c.creditLimit > 0 ? `• Credit Limit: ${formatPeso(c.creditLimit)}` : ""}`
                              : "Retail"}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center h-full">
          <Button size="lg" onClick={() => setIsAddOpen(true)} className="shrink-0 h-full px-2.5 text-xs font-medium" >
          <Plus className=" h-7 w-4" /> <User className=""/>
        </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 border border-input bg-card rounded-[4px] overflow-hidden ">
        {/* Searchable Customer Selector */}

        <div className="h-8 border-b border-border flex justify-between items-center bg-muted px-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase text-muted-foreground font-bold">
              Line Items ({cart.length})
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[11px] text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#F87171] px-2 py-0.5 rounded-[2px] flex items-center gap-1 cursor-pointer font-bold uppercase font-mono transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Void
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-card">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-muted border-b border-border shadow-sm z-10">
              <tr>
                <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold w-full">
                  Item
                </th>
                <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right">
                  Qty
                </th>
                <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Register is empty.
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => (
                  <CartItemRow
                    key={item.productId ?? item.id}
                    item={item}
                    index={idx}
                    onUpdateQuantity={onUpdateQuantity}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <CartSummary cartTotal={cartTotal} />
      </div>

      <AddCustomerModal
              isOpen={isAddOpen}
              mode="add"
              onClose={() => setIsAddOpen(false)}
              onSuccess={() => {
                setIsAddOpen(false);
                hookData.refetch();
              }}
            />
    </div>
  );
}
