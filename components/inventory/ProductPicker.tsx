// Product picker for the Inventory Management module of the POS system.
// Searches live inventory (GET /inventory?search=) so staff can pick a product by name or SKU.
// Used by the standalone stock adjustment form where no inventory row was clicked.
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { InventoryItem, InventoryResponse } from "@/lib/inventory/types";

interface ProductPickerProps {
  onSelect: (item: InventoryItem) => void;
}

interface SearchResult {
  query: string;
  items: InventoryItem[];
  failed: boolean;
}

// Renders a search box with a short list of matching products.
export function ProductPicker({ onSelect }: ProductPickerProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [result, setResult] = React.useState<SearchResult | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!debouncedSearch) {
      return;
    }

    let cancelled = false;

    apiClient
      .get<InventoryResponse>("/inventory", {
        params: { search: debouncedSearch, limit: 8 },
      })
      .then((response) => {
        if (!cancelled) {
          setResult({
            query: debouncedSearch,
            items: response.data.data,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ query: debouncedSearch, items: [], failed: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const hasQuery = debouncedSearch !== "";
  const isLoading = hasQuery && result?.query !== debouncedSearch;
  const items = hasQuery && result?.query === debouncedSearch ? result.items : [];
  const failed = hasQuery && result?.query === debouncedSearch && result.failed;

  return (
    <div className="space-y-2">
      <Input
        autoFocus
        placeholder="Search product by name or SKU..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rounded-[2px]"
      />

      {isLoading && (
        <p className="text-xs text-muted-foreground">Searching...</p>
      )}

      {failed && (
        <p className="text-xs text-destructive">
          Could not search products. Please try again.
        </p>
      )}

      {hasQuery && !isLoading && !failed && items.length === 0 && (
        <p className="text-xs text-muted-foreground">No products found.</p>
      )}

      {items.length > 0 && (
        <ul className="max-h-48 divide-y overflow-y-auto rounded-[2px] border border-border">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {item.sku ?? "-"} · {item.current_quantity} {item.base_uom}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
