"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountsReceivable } from "@/lib/analytics/analytics-api";
import { formatPeso } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AnalyticsEmpty,
  AnalyticsError,
  AnalyticsLoading,
  UpdatingBadge,
} from "./AnalyticsFeedback";

const ROW_LIMIT_OPTIONS = [10, 25, 50];

function AgingCell({ value, severity }: { value: number; severity: "warn" | "high" }) {
  if (value <= 0) {
    return <span className="font-mono tabular-nums text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-medium",
        severity === "warn"
          ? "text-amber-600"
          : "text-red-600",
      )}
    >
      {formatPeso(value)}
    </span>
  );
}

export function AccountsReceivableTab({ refreshKey }: { refreshKey: number }) {
  const [limit, setLimit] = useState(10);
  // AR analytics is point-in-time — the endpoint accepts no date range.
  const { data, loading, error, refreshing, refetch } = useAccountsReceivable(
    { limit },
    refreshKey,
  );

  if (loading && !data) return <AnalyticsLoading />;
  if (error && !data) return <AnalyticsError message={error} onRetry={refetch} />;
  if (!data) return null;

  const overview = data.credit_overview;
  const hasAging = data.aging_table.length > 0;
  const hasTop = data.top_credit_customers.length > 0;

  return (
    <div className="space-y-4">
      <UpdatingBadge show={refreshing} />
      {/* Credit portfolio overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card size="sm" className="gap-1">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Credit Extended
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatPeso(overview.total_credit_extended)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-1">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Outstanding Debt
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums text-amber-600">
              {formatPeso(overview.total_outstanding_debt)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-1">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Utilization
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {overview.credit_utilization_percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-1">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wholesale Accounts
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {overview.total_wholesale_accounts}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AR aging matrix */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">AR Aging Matrix</CardTitle>
          <span className="text-[11px] text-muted-foreground">
            <span className="mr-2 inline-block h-2 w-2 rounded-sm bg-amber-400 align-middle" />
            1–60 days overdue{" "}
            <span className="ml-2 inline-block h-2 w-2 rounded-sm bg-red-500 align-middle" />
            60+ days overdue
          </span>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total Debt</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1–30 Days</TableHead>
                  <TableHead className="text-right">31–60 Days</TableHead>
                  <TableHead className="text-right">60+ Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasAging ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No outstanding receivables — all wholesale accounts are
                      settled.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.aging_table.map((row) => (
                    <TableRow key={row.customerId}>
                      <TableCell className="max-w-[200px] font-medium whitespace-normal break-words">
                        {row.company_name}
                      </TableCell>
                      <TableCell className="max-w-[140px] whitespace-normal break-words text-xs">
                        {row.customer_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {row.contact_number}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold">
                        {formatPeso(row.total_outstanding_balance)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {row.current_amount > 0 ? (
                          formatPeso(row.current_amount)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AgingCell value={row.days_1_30_overdue} severity="warn" />
                      </TableCell>
                      <TableCell className="text-right">
                        <AgingCell value={row.days_31_60_overdue} severity="warn" />
                      </TableCell>
                      <TableCell className="text-right">
                        <AgingCell value={row.days_60_plus_overdue} severity="high" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top credit wholesale customers */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Top Credit Wholesale Customers</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Show top</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger className="h-7 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ROW_LIMIT_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Sales Volume</TableHead>
                  <TableHead className="text-right">Settled Payments</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Promptness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasTop ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No wholesale credit activity yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.top_credit_customers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="max-w-[220px] font-medium whitespace-normal break-words">
                        {customer.company_name}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPeso(customer.total_sales_volume)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPeso(customer.total_settled_payments)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold">
                        {formatPeso(customer.current_outstanding_balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono tabular-nums",
                            customer.promptness_score >= 80
                              ? "text-emerald-600"
                              : customer.promptness_score >= 50
                                ? "text-amber-600"
                                : "text-red-600",
                          )}
                        >
                          {customer.promptness_score.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!hasAging && !hasTop && (
        <AnalyticsEmpty message="No accounts receivable data available." />
      )}
    </div>
  );
}
