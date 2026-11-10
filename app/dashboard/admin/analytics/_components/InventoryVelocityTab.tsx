"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useInventoryVelocity } from "@/lib/analytics/analytics-api";
import {
  AGING_DAY_OPTIONS,
  type AnalyticsDateParams,
  type VelocitySortBy,
} from "@/lib/analytics/types";
import { formatPeso } from "@/lib/utils";
import {
  AnalyticsEmpty,
  AnalyticsError,
  AnalyticsLoading,
  InvalidRangeNotice,
} from "./AnalyticsFeedback";

const ROW_LIMIT_OPTIONS = [10, 25, 50];

function formatQty(value: number): string {
  return value.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

export function InventoryVelocityTab({
  params,
  refreshKey,
  enabled,
}: {
  params: AnalyticsDateParams;
  refreshKey: number;
  enabled: boolean;
}) {
  const [agingDays, setAgingDays] = useState<number>(30);
  const [sortBy, setSortBy] = useState<VelocitySortBy>("QUANTITY");
  const [limit, setLimit] = useState(10);

  const { data, loading, error, refetch } = useInventoryVelocity(
    {
      startDate: params.startDate,
      endDate: params.endDate,
      agingDays,
      sortBy,
      limit,
    },
    refreshKey,
    enabled,
  );

  if (!enabled) return <InvalidRangeNotice />;
  if (loading && !data) return <AnalyticsLoading />;
  if (error && !data) return <AnalyticsError message={error} onRetry={refetch} />;
  if (!data) return null;

  const hasFast = data.fast_moving_items.length > 0;
  const hasSlow = data.slow_moving_items.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Dead stock older than</span>
          <Select
            value={String(agingDays)}
            onValueChange={(value) => setAgingDays(Number(value))}
          >
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {AGING_DAY_OPTIONS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {(["QUANTITY", "REVENUE"] as VelocitySortBy[]).map((option) => (
            <Button
              key={option}
              type="button"
              variant={sortBy === option ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSortBy(option)}
            >
              {option === "QUANTITY" ? "By Quantity" : "By Revenue"}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show top</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
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
      </div>

      {error && data && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fast-Moving Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead className="text-right">Txns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasFast ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No fast-moving items for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.fast_moving_items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="max-w-[240px] font-medium whitespace-normal break-words">
                        {item.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] whitespace-normal break-words text-xs">
                        {item.category_name}
                      </TableCell>
                      <TableCell className="text-xs">{item.base_uom}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQty(item.current_quantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQty(item.total_base_quantity_sold)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPeso(item.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPeso(item.total_gross_profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.transaction_count}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Slow-Moving / Dead Stock{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (no sales in {agingDays}+ days)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Bin Location</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost / Unit</TableHead>
                  <TableHead className="text-right">Tied-Up Capital</TableHead>
                  <TableHead className="text-right">Sales (window)</TableHead>
                  <TableHead className="text-right">Days w/o Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasSlow ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No slow-moving stock detected for this aging window.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.slow_moving_items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="max-w-[240px] font-medium whitespace-normal break-words">
                        {item.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] whitespace-normal break-words text-xs">
                        {item.bin_location || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQty(item.current_quantity)} {item.base_uom}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPeso(item.cost_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold">
                        {formatPeso(item.tied_up_capital)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQty(item.sales_in_aging_period)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.days_without_sales}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasSlow && (
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              Total tied-up capital:{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {formatPeso(
                  data.slow_moving_items.reduce(
                    (sum, item) => sum + item.tied_up_capital,
                    0,
                  ),
                )}
              </span>{" "}
              across {data.slow_moving_items.length} item
              {data.slow_moving_items.length === 1 ? "" : "s"}
            </div>
          )}
        </CardContent>
      </Card>

      {!hasFast && !hasSlow && (
        <AnalyticsEmpty message="No inventory velocity data for this period." />
      )}
    </div>
  );
}
