// Filter bar for POS invoice history: invoice search, type, and date range.
// Page owns filter state; GET /transactions receives search, transaction_type, startDate, endDate.
// Payment method is omitted because the list endpoint has no paymentMethod query.

"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type InvoiceTransactionType = "RETAIL" | "WHOLESALE" | "";

export interface InvoiceListFilters {
  search: string;
  transactionType: InvoiceTransactionType;
  startDate: string;
  endDate: string;
}

export const EMPTY_INVOICE_FILTERS: InvoiceListFilters = {
  search: "",
  transactionType: "",
  startDate: "",
  endDate: "",
};

/** True when both dates are set and end is before start. */
export function isInvalidInvoiceDateRange(filters: InvoiceListFilters): boolean {
  return Boolean(
    filters.startDate && filters.endDate && filters.endDate < filters.startDate,
  );
}

interface InvoiceFilterBarProps {
  filters: InvoiceListFilters;
  onFiltersChange: (filters: InvoiceListFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function InvoiceFilterBar({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
}: InvoiceFilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.transactionType ||
      filters.startDate ||
      filters.endDate,
  );
  const invalidRange = isInvalidInvoiceDateRange(filters);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Invoice # or receipt ID..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="h-8 w-[220px] pl-9 text-xs font-sans rounded-[2px] focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select
            value={filters.transactionType || "ALL"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                transactionType:
                  !value || value === "ALL"
                    ? ""
                    : (value as InvoiceTransactionType),
              })
            }
          >
            <SelectTrigger className="!h-8 w-[150px] text-xs rounded-[2px]">
              <SelectValue placeholder="All types">
                {(value: string) =>
                  value === "ALL" || !value
                    ? "All types"
                    : value === "WHOLESALE"
                      ? "Wholesale"
                      : "Retail"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs">
                All types
              </SelectItem>
              <SelectItem value="RETAIL" className="text-xs">
                Retail
              </SelectItem>
              <SelectItem value="WHOLESALE" className="text-xs">
                Wholesale
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Date range</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">From:</span>
            <Input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(e) =>
                onFiltersChange({ ...filters, startDate: e.target.value })
              }
              className="h-8 w-[125px] font-mono text-xs rounded-[2px]"
            />
            <span className="text-xs text-muted-foreground">To:</span>
            <Input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(e) =>
                onFiltersChange({ ...filters, endDate: e.target.value })
              }
              className="h-8 w-[125px] font-mono text-xs rounded-[2px]"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ ...EMPTY_INVOICE_FILTERS })}
            className="h-8 px-2 text-xs rounded-[2px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 w-8 rounded-[2px] shrink-0"
          title="Refresh invoices"
          aria-label="Refresh invoices"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {invalidRange && (
        <p className="text-xs text-destructive">
          End date must be on or after the start date.
        </p>
      )}
    </div>
  );
}
