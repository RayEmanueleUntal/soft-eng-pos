"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import { useSalesPerformance } from "@/lib/analytics/analytics-api";
import {
  GROUPING_INTERVALS,
  type AnalyticsDateParams,
  type GroupingInterval,
} from "@/lib/analytics/types";
import { formatPeso } from "@/lib/utils";
import {
  AnalyticsEmpty,
  AnalyticsError,
  AnalyticsLoading,
  InvalidRangeNotice,
  UpdatingBadge,
} from "./AnalyticsFeedback";
import { CHART_COLORS, PAYMENT_METHOD_COLORS, colorForIndex } from "./chart-theme";

function LedgerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function FinancialPerformanceTab({
  params,
  refreshKey,
  enabled,
}: {
  params: AnalyticsDateParams;
  refreshKey: number;
  enabled: boolean;
}) {
  const [interval, setInterval] = useState<GroupingInterval>("DAILY");
  const { data, loading, error, refreshing, refetch } = useSalesPerformance(
    { ...params, interval },
    refreshKey,
    enabled,
  );

  if (!enabled) return <InvalidRangeNotice />;
  if (loading && !data) return <AnalyticsLoading />;
  if (error && !data) return <AnalyticsError message={error} onRetry={refetch} />;
  if (!data) return null;

  const hasTrend = data.trend.length > 0;
  const hasPayments = data.payment_breakdown.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Revenue and net profit trends with payment method mix.
        </p>
        <div className="flex items-center gap-3">
          <UpdatingBadge show={refreshing} />
          <span className="text-xs text-muted-foreground">Interval</span>
          <Select
            value={interval}
            onValueChange={(value) => setInterval(value as GroupingInterval)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {GROUPING_INTERVALS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue & Net Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {hasTrend ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.trend}
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date_label"
                      tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                      tickLine={false}
                      tickFormatter={(value: number) =>
                        `₱${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                      }
                      width={56}
                    />
                    <Tooltip
                      formatter={(value) => formatPeso(Number(value))}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.revenue}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="net_profit"
                      name="Net Profit"
                      stroke={CHART_COLORS.netProfit}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <AnalyticsEmpty message="No sales trend data for this period." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {hasPayments ? (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.payment_breakdown}
                        dataKey="total_amount"
                        nameKey="payment_method"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        strokeWidth={1}
                      >
                        {data.payment_breakdown.map((entry, index) => (
                          <Cell
                            key={entry.payment_method}
                            fill={
                              PAYMENT_METHOD_COLORS[entry.payment_method] ??
                              colorForIndex(index)
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatPeso(Number(value))} />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) =>
                          value.length > 14 ? `${value.slice(0, 14)}…` : value
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {data.payment_breakdown.map((entry) => (
                    <div
                      key={entry.payment_method}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        {entry.payment_method}
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
              <AnalyticsEmpty message="No payment breakdown for this period." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Summary Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <LedgerStat
              label="Total Revenue"
              value={formatPeso(data.summary_ledger.total_revenue)}
            />
            <LedgerStat
              label="Discounts"
              value={formatPeso(data.summary_ledger.total_discounts)}
            />
            <LedgerStat
              label="COGS"
              value={formatPeso(data.summary_ledger.total_cogs)}
            />
            <LedgerStat
              label="Gross Profit"
              value={formatPeso(data.summary_ledger.gross_profit)}
            />
            <LedgerStat
              label="Gross Margin"
              value={`${data.summary_ledger.gross_profit_margin_percentage.toFixed(1)}%`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
