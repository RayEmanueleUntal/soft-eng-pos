// Product picker for the Inventory Management module of the POS system.
// Searches products (GET /products?search=) with multi-attribute support so staff can pick a product by name, SKU, etc.
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
  const [size, setSize] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [thread, setThread] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedSize, setDebouncedSize] = React.useState("");
  const [debouncedMaterial, setDebouncedMaterial] = React.useState("");
  const [debouncedThread, setDebouncedThread] = React.useState("");
  const [result, setResult] = React.useState<SearchResult | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setDebouncedSize(size.trim());
      setDebouncedMaterial(material.trim());
      setDebouncedThread(thread.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search, size, material, thread]);

  const queryKey = [debouncedSearch, debouncedSize, debouncedMaterial, debouncedThread].join("|");
  const hasQuery = Boolean(debouncedSearch || debouncedSize || debouncedMaterial || debouncedThread);

  React.useEffect(() => {
    if (!hasQuery) {
      setResult(null);
      return;
    }

    let cancelled = false;

    apiClient
      .get<InventoryResponse>("/products", {
        params: {
          search: debouncedSearch || undefined,
          size: debouncedSize || undefined,
          material: debouncedMaterial || undefined,
          thread: debouncedThread || undefined,
          limit: 10,
        },
      })
      .then((response) => {
        if (!cancelled) {
          setResult({
            query: queryKey,
            items: response.data.data,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ query: queryKey, items: [], failed: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, debouncedSize, debouncedMaterial, debouncedThread, hasQuery, queryKey]);

  const isLoading = hasQuery && result?.query !== queryKey;
  const items = hasQuery && result?.query === queryKey ? result.items : [];
  const failed = hasQuery && result?.query === queryKey && result.failed;

  return (
    <div className="space-y-2">
      <Input
        autoFocus
        placeholder="Search product by name or SKU..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rounded-[2px]"
      />

      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="Size..."
          value={size}
          onChange={(event) => setSize(event.target.value)}
          className="rounded-[2px] h-7 text-xs"
        />
        <Input
          placeholder="Thread..."
          value={thread}
          onChange={(event) => setThread(event.target.value)}
          className="rounded-[2px] h-7 text-xs"
        />
        <Input
          placeholder="Material..."
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
          className="rounded-[2px] h-7 text-xs"
        />
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Searching products...</p>
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
                <div className="truncate">
                  <span className="truncate font-medium">{item.name}</span>
                  {(item.size_dimensions || item.material_grade || item.thread_type) && (
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {[item.size_dimensions, item.thread_type, item.material_grade].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
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
