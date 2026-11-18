// Filter bar for the admin Expenses page of the POS system.
// Controls category, payment method and a start/end date range; the page owns the filter state.
// Used only by /dashboard/admin/expenses.
"use client";

import { Plus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_EXPENSE_FILTERS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseFilters,
} from "@/lib/admin/expense-types";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/analytics/types";

interface ExpenseFilterBarProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
  onCreate: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

// Returns true when both dates are set and the end date is before the start date.
export function isInvalidDateRange(filters: ExpenseFilters): boolean {
  return Boolean(
    filters.startDate && filters.endDate && filters.endDate < filters.startDate,
  );
}

// Renders the filter controls and a Clear button.
export function ExpenseFilterBar({
  filters,
  onFiltersChange,
  onRefresh,
  onCreate,
  loading = false,
}: ExpenseFilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.category ||
      filters.payment_method ||
      filters.startDate ||
      filters.endDate,
  );
  const invalidRange = isInvalidDateRange(filters);

  const formatTitleCase = (str: string) =>
    str
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={filters.category || "ALL"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                category:
                  !value || value === "ALL" ? "" : (value as ExpenseCategory),
              })
            }
          >
            <SelectTrigger className="!h-8 w-[180px] text-xs rounded-[2px]">
              <SelectValue placeholder="All Categories">
                {(value: string) =>
                  value === "ALL"
                    ? "All Categories"
                    : formatTitleCase(
                        EXPENSE_CATEGORY_LABELS[value as ExpenseCategory] ??
                          value,
                      )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs">
                All Categories
              </SelectItem>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="text-xs"
                >
                  {formatTitleCase(
                    EXPENSE_CATEGORY_LABELS[category] ?? category,
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Payment Method</Label>
          <Select
            value={filters.payment_method || "ALL"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                payment_method:
                  !value || value === "ALL" ? "" : (value as PaymentMethod),
              })
            }
          >
            <SelectTrigger className="!h-8 w-[170px] text-xs rounded-[2px]">
              <SelectValue placeholder="All Payment Methods">
                {(value: string) =>
                  value === "ALL"
                    ? "All Payment Methods"
                    : formatTitleCase(value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs">
                All Payment Methods
              </SelectItem>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method} className="text-xs">
                  {formatTitleCase(method)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(startDate) =>
            onFiltersChange({ ...filters, startDate })
          }
          onEndDateChange={(endDate) =>
            onFiltersChange({ ...filters, endDate })
          }
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ ...EMPTY_EXPENSE_FILTERS })}
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
          title="Refresh expenses"
          aria-label="Refresh expenses"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>

        {/* New Expense Button (Furthest Right) */}
        <div className="ml-auto">
          <Button
            onClick={onCreate}
            className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Expense
          </Button>
        </div>
      </div>

      {invalidRange && (
        <p className="text-xs text-destructive">
          End date must be on or after the start date.
        </p>
      )}
    </div>
  );
}