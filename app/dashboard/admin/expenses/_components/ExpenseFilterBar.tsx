// Filter bar for the admin Expenses page of the POS system.
// Controls category, payment method and a start/end date range; the page owns the filter state.
// Used only by /dashboard/admin/expenses.
"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}: ExpenseFilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.category ||
      filters.payment_method ||
      filters.startDate ||
      filters.endDate,
  );
  const invalidRange = isInvalidDateRange(filters);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.category || "ALL"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: !value || value === "ALL" ? "" : (value as ExpenseCategory),
            })
          }
        >
          <SelectTrigger className="h-8 w-[180px] text-[13px] rounded-[2px]">
            <SelectValue placeholder="All categories">
              {(value: string) =>
                value === "ALL"
                  ? "All categories"
                  : EXPENSE_CATEGORY_LABELS[value as ExpenseCategory]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="ALL">All categories</SelectItem>
            {EXPENSE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          <SelectTrigger className="h-8 w-[170px] text-[13px] rounded-[2px]">
            <SelectValue placeholder="All payment methods">
              {(value: string) =>
                value === "ALL" ? "All payment methods" : value.replace(/_/g, " ")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="ALL">All payment methods</SelectItem>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          From
          <Input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value })
            }
            className="h-8 w-[150px] font-mono text-[13px] rounded-[2px]"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          To
          <Input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value })
            }
            className="h-8 w-[150px] font-mono text-[13px] rounded-[2px]"
          />
        </label>

        <Button
          variant="ghost"
          onClick={() => onFiltersChange({ ...EMPTY_EXPENSE_FILTERS })}
          disabled={!hasActiveFilters}
          className="h-8 px-3 text-[13px] rounded-[2px]"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
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
