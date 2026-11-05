// Manual product search for the Create Purchase Order form in the POS inventory module.
// Debounces a SKU/name search plus size, thread and material filters against GET /products.
// Used only by CreatePurchaseOrderForm to append a matching product to the draft.
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts } from "@/lib/inventory/purchase-order-api";
import { InventoryItem } from "@/lib/inventory/types";
import { getErrorMessage } from "@/lib/utils";

interface ProductFilters {
  search: string;
  size: string;
  thread: string;
  material: string;
}

const EMPTY_FILTERS: ProductFilters = { search: "", size: "", thread: "", material: "" };

const FILTER_FIELDS: { key: Exclude<keyof ProductFilters, "search">; label: string }[] = [
  { key: "size", label: "Size" },
  { key: "thread", label: "Thread" },
  { key: "material", label: "Material" },
];

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

// Renders the search box, the attribute filters and the short list of matching products.
export function PoProductSearch({
  addedProductIds,
  disabled,
  onAdd,
}: PoProductSearchProps) {
  const [filters, setFilters] = React.useState<ProductFilters>(EMPTY_FILTERS);
  const [debounced, setDebounced] = React.useState<ProductFilters>(EMPTY_FILTERS);
  const [result, setResult] = React.useState<SearchResult | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(
      () =>
        setDebounced({
          search: filters.search.trim(),
          size: filters.size.trim(),
          thread: filters.thread.trim(),
          material: filters.material.trim(),
        }),
      300,
    );
    return () => clearTimeout(timer);
  }, [filters]);

  const queryKey = JSON.stringify(debounced);
  const hasQuery = Object.values(debounced).some((value) => value !== "");

  React.useEffect(() => {
    if (!hasQuery) return;
    let active = true;

    searchProducts({ ...debounced, limit: 8 })
      .then((response) => {
        if (active) setResult({ query: queryKey, items: response.data, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            query: queryKey,
            items: [],
            error: getErrorMessage(err, "Could not search products."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [debounced, hasQuery, queryKey]);

  const current = hasQuery && result?.query === queryKey ? result : null;
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
          value={filters.search}
          disabled={disabled}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="h-9 rounded-[4px] pl-8 text-xs"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FILTER_FIELDS.map(({ key, label }) => (
          <Input
            key={key}
            placeholder={label}
            aria-label={`Filter by ${label.toLowerCase()}`}
            value={filters[key]}
            disabled={disabled}
            onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
            className="h-8 rounded-[4px] font-mono text-xs"
          />
        ))}
      </div>

      <div className="max-h-44 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
        {!hasQuery ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            Type a SKU or name, or filter by size, thread or material.
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
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {item.sku ?? "—"} · {item.current_quantity} {item.base_uom}
                    {item.size_dimensions ? ` · ${item.size_dimensions}` : ""}
                    {item.thread_type ? ` · ${item.thread_type}` : ""}
                    {item.material_grade ? ` · ${item.material_grade}` : ""}
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
