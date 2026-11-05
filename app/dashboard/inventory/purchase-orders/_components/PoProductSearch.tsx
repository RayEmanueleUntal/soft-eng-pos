// Manual product search for the Create Purchase Order form in the POS inventory module.
// Debounces a SKU/name search against GET /products and lets staff append a match to the draft.
// Used only by CreatePurchaseOrderForm.
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts } from "@/lib/inventory/purchase-order-api";
import { InventoryItem } from "@/lib/inventory/types";
import { getErrorMessage } from "@/lib/utils";

interface SearchResult {
  query: string;
  items: InventoryItem[];
  error: string | null;
}

interface PoProductSearchProps {
  addedProductIds: Set<number>;
  disabled: boolean;
  onAdd: (item: InventoryItem) => void;
}

// Renders the search box and its short list of matching products.
export function PoProductSearch({
  addedProductIds,
  disabled,
  onAdd,
}: PoProductSearchProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [result, setResult] = React.useState<SearchResult | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!debouncedSearch) return;
    let active = true;

    searchProducts({ search: debouncedSearch, limit: 8 })
      .then((response) => {
        if (active) {
          setResult({ query: debouncedSearch, items: response.data, error: null });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            query: debouncedSearch,
            items: [],
            error: getErrorMessage(err, "Could not search products."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const hasQuery = debouncedSearch !== "";
  const current = hasQuery && result?.query === debouncedSearch ? result : null;
  const isLoading = hasQuery && current === null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Search products
      </h4>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by SKU or name..."
          value={search}
          disabled={disabled}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-[4px] pl-8 text-xs"
        />
      </div>

      <div className="max-h-44 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
        {!hasQuery ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            Type a SKU or product name to search.
          </p>
        ) : isLoading ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Searching...</p>
        ) : current?.error ? (
          <p className="break-words p-4 text-center text-xs text-destructive">
            {current.error}
          </p>
        ) : current?.items.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No products found.
          </p>
        ) : (
          current?.items.map((item) => {
            const added = addedProductIds.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground" title={item.name}>
                    {item.name}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.sku ?? "—"} · {item.current_quantity} {item.base_uom}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={added ? "ghost" : "outline"}
                  size="xs"
                  disabled={disabled || added}
                  onClick={() => onAdd(item)}
                >
                  {added ? "Added" : "Add"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
