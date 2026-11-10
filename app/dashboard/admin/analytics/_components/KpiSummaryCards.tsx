"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardSummary } from "@/lib/analytics/analytics-api";
import type { AnalyticsDateParams } from "@/lib/analytics/types";
import { formatPeso } from "@/lib/utils";
import { AnalyticsError, AnalyticsLoading } from "./AnalyticsFeedback";

interface KpiCardProps {
  label: string;
  value: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  hint?: string;
}

function KpiCard({ label, value, badge, badgeVariant = "secondary", hint }: KpiCardProps) {
  return (
    <Card size="sm" className="gap-1">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {badge && (
            <Badge variant={badgeVariant} className="font-mono text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
        <p className="font-mono text-xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiSummaryCards({
  params,
  refreshKey,
  enabled,
}: {
  params: AnalyticsDateParams;
  refreshKey: number;
  enabled: boolean;
}) {
  const { data, loading, error, refetch } = useDashboardSummary(
    params,
    refreshKey,
    enabled,
  );

  if (!enabled) return null;
  if (loading && !data) return <AnalyticsLoading label="Loading KPIs..." />;
  if (error && !data)
    return <AnalyticsError message={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        label="Total Sales Revenue"
        value={formatPeso(data.total_sales_revenue)}
        hint="Completed transactions"
      />
      <KpiCard
        label="Gross Profit"
        value={formatPeso(data.gross_profit.amount)}
        badge={`${data.gross_profit.margin_percentage.toFixed(1)}% margin`}
        badgeVariant={
          data.gross_profit.margin_percentage >= 0 ? "secondary" : "destructive"
        }
        hint={`COGS ${formatPeso(data.total_cogs)}`}
      />
      <KpiCard
        label="Total OpEx"
        value={formatPeso(data.total_opex)}
        hint="Operating expenses"
      />
      <KpiCard
        label="Net Profit"
        value={formatPeso(data.net_profit.amount)}
        badge={`${data.net_profit.margin_percentage.toFixed(1)}% margin`}
        badgeVariant={
          data.net_profit.amount >= 0 ? "secondary" : "destructive"
        }
        hint="Gross profit − OpEx"
      />
      <KpiCard
        label="Active Receivables"
        value={formatPeso(data.total_active_receivables)}
        hint="Outstanding wholesale credit"
      />
    </div>
  );
}
