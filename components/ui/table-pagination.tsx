"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

// Builds the visible page list, e.g. 1 2 3 … 20 or 1 … 9 10 11 … 20.
function getPageItems(page: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: PageItem[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(total - 1, page + 1);
  if (left > 2) items.push("start-ellipsis");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push("end-ellipsis");
  items.push(total);
  return items;
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  loading = false,
  totalItems,
  pageSize,
  itemLabel = "items",
  className,
}: TablePaginationProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (totalPages <= 1) {
    return null;
  }

  const goTo = (target: number) => {
    if (!loading && target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
  };

  const startEditing = () => {
    setDraft(String(page));
    setEditing(true);
  };

  const commit = () => {
    const typed = parseInt(draft, 10);
    if (!Number.isNaN(typed)) {
      goTo(Math.min(Math.max(typed, 1), totalPages));
    }
    setEditing(false);
  };

  const countText =
    totalItems !== undefined && pageSize !== undefined
      ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalItems)} of ${totalItems} ${itemLabel}`
      : `Page ${page} of ${totalPages}`;

    return (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-1",
            className,
          )}
        >
          <p className="text-xs text-muted-foreground">{countText}</p>
    
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="Previous page"
              disabled={loading || page <= 1}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft />
            </Button>
    
            {getPageItems(page, totalPages).map((item) => {
              if (typeof item !== "number") {
                return (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="select-none px-1 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                );
              }
    
              if (item === page) {
                return editing ? (
                  <input
                    key={item}
                    ref={inputRef}
                    value={draft}
                    inputMode="numeric"
                    maxLength={String(totalPages).length}
                    aria-label={`Go to page (1 to ${totalPages})`}
                    // Keeps digits only, also when text is pasted.
                    onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    onBlur={() => setEditing(false)}
                    className="h-6 w-10 rounded-md border border-primary bg-background text-center text-xs font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                ) : (
                  <Button
                    key={item}
                    size="xs"
                    aria-current="page"
                    title="Double-click to type a page number"
                    className="min-w-6 tabular-nums"
                    onDoubleClick={startEditing}
                  >
                    {pad(item)}
                  </Button>
                );
              }
    
              return (
                <Button
                  key={item}
                  variant="secondary"
                  size="xs"
                  className="min-w-6 tabular-nums text-muted-foreground"
                  disabled={loading}
                  onClick={() => goTo(item)}
                >
                  {pad(item)}
                </Button>
              );
            })}
    
            <Button
              variant="secondary"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="Next page"
              disabled={loading || page >= totalPages}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      );
    }  