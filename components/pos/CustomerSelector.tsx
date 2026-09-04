"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { POSCustomer } from "@/lib/pos/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerSelectorProps {
  selectedCustomer: POSCustomer | null;
  onSelectCustomer: (customer: POSCustomer | null) => void;
}

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<POSCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`/customers/search`, {
        params: { query },
      });
      setSearchResults(response.data || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Failed to search customers:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: POSCustomer) => {
    onSelectCustomer(customer);
    setSearchQuery("");
    setSearchResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Customer Details</h3>
        {selectedCustomer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs h-7 text-destructive"
          >
            Clear Customer
          </Button>
        )}
      </div>

      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
          <div>
            <p className="font-medium text-sm">{selectedCustomer.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedCustomer.contact_number}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              selectedCustomer.type === "WHOLESALE"
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {selectedCustomer.type}
          </span>
        </div>
      ) : (
        <div className="relative">
          <Input
            type="text"
            placeholder="Search customer by name or contact number..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full text-sm"
          />

          {loading && (
            <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
              Searching...
            </div>
          )}

          {isOpen && searchResults.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
              {searchResults.map((customer) => (
                <button
                  key={customer.customerId}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.contact_number}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      customer.type === "WHOLESALE"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {customer.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isOpen && !loading && searchResults.length === 0 && searchQuery.trim() !== "" && (
            <div className="absolute z-10 left-0 right-0 mt-1 p-3 text-xs text-muted-foreground bg-popover border rounded-md shadow-md">
              No matching customers found. Defaulting to Retail Guest.
            </div>
          )}
        </div>
      )}
    </div>
  );
}