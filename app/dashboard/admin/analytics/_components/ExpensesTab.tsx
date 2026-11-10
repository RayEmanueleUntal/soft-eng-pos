"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExpenseAnalytics } from "@/lib/analytics/analytics-api";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type AnalyticsDateParams,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/analytics/types";
import { formatPeso } from "@/lib/utils";
import {
  AnalyticsEmpty,
  AnalyticsError,
  AnalyticsLoading,
  InvalidRangeNotice,
} from "./AnalyticsFeedback";
import { colorForIndex } from "./chart-theme";

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SALARIES_WAGES: "Salaries & Wages",
  TAXES_LICENCES: "Taxes & Licences",
  MAINTENANCE: "Maintenance",
  LOGISTICS: "Logistics",
  SUPPLIES: "Supplies",
  MISCELLANEOUS: "Miscellaneous",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function ExpensesTab({
  params,
  refreshKey,
  enabled,
}: {
  params: AnalyticsDateParams;
  refreshKey: number;
  enabled: boolean;
}) {
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const query = useExpenseAnalytics(
    {
      startDate: params.startDate,
      endDate: params.endDate,
      category,
      payment_method: paymentMethod,
      page,
      limit,
    },
    refreshKey,
    enabled,
  );
  const { data, loading, error, refetch } = query;

  // Reset to first page whenever filters or the global range change.
  useEffect(() => {
    setPage(1);
  }, [params.startDate, params.endDate, category, paymentMethod, limit]);

  if (!enabled) return <InvalidRangeNotice />;
  if (loading && !data) return <AnalyticsLoading />;
  if (error && !data) return <AnalyticsError message={error} onRetry={refetch} />;
  if (!data) return null;

  const hasBreakdown = data.category_breakdown.length > 0;
  const hasExpenses = data.expense_list.length > 0;
  const { pagination } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category || "all"}
          onValueChange={(value) =>
            setCategory(value === "all" ? "" : (value as ExpenseCategory))
          }
        >
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {EXPENSE_CATEGORY_LABELS[option]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={paymentMethod || "all"}
          onValueChange={(value) =>
            setPaymentMethod(value === "all" ? "" : (value as PaymentMethod))
          }
        >
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="All payment methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All payment methods</SelectItem>
              {PAYMENT_METHODS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total OpEx</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatPeso(data.total_opex)}
          </span>
        </div>
      </div>

      {error && data && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {hasBreakdown ? (
              <>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.category_breakdown}
                        dataKey="total_amount"
                        nameKey="category"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        strokeWidth={1}
                      >
                        {data.category_breakdown.map((entry, index) => (
                          <Cell key={entry.category} fill={colorForIndex(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, item) => {
                          const payload = item?.payload as
                            | { category?: string; percentage_share?: number }
                            | undefined;
                          return [
                            `${formatPeso(Number(value))} (${payload?.percentage_share?.toFixed(1) ?? "0"}%)`,
                            payload?.category ?? "",
                          ];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) =>
                          EXPENSE_CATEGORY_LABELS[value as ExpenseCategory] ?? value
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {data.category_breakdown.map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        {EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatPeso(entry.total_amount)}{" "}
                        <span className="text-muted-foreground">
                          ({entry.percentage_share.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <AnalyticsEmpty message="No expenses recorded for this period." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Itemized Expense Ledger</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasExpenses ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No expenses found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.expense_list.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-xs tabular-nums whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="max-w-[160px] whitespace-normal break-words">
                          {EXPENSE_CATEGORY_LABELS[expense.category] ??
                            expense.category}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {expense.payment_method.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatPeso(expense.amount)}
                        </TableCell>
                        <TableCell className="max-w-[140px] whitespace-normal break-words text-xs">
                          {expense.staff?.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[220px] whitespace-normal break-words text-xs text-muted-foreground">
                          {expense.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
              <span>
                {pagination.total_count} record
                {pagination.total_count === 1 ? "" : "s"} · Page{" "}
                {pagination.current_page} of {Math.max(pagination.total_pages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(value) => setLimit(Number(value))}
                >
                  <SelectTrigger className="h-7 w-[90px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} / page
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={
                    page >= pagination.total_pages || loading || !hasExpenses
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
