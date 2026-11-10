// Executive Analytics Dashboard (Admin/Manager only via /dashboard/admin RBAC).
// Aggregates KPIs, financial trends, OpEx, inventory velocity, and AR credit risk
// from the backend /analytics endpoints. All data fetching lives in
// lib/analytics/analytics-api.ts through apiClient.
"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/pageheader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AnalyticsDateParams } from "@/lib/analytics/types";
import { AccountsReceivableTab } from "./_components/AccountsReceivableTab";
import { ExpensesTab } from "./_components/ExpensesTab";
import { FinancialPerformanceTab } from "./_components/FinancialPerformanceTab";
import { InventoryVelocityTab } from "./_components/InventoryVelocityTab";
import { KpiSummaryCards } from "./_components/KpiSummaryCards";
import { InvalidRangeNotice } from "./_components/AnalyticsFeedback";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgoInput(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

function yearToDateInput(): { start: string; end: string } {
  const now = new Date();
  return {
    start: `${now.getFullYear()}-01-01`,
    end: toDateInputValue(now),
  };
}

// Sends the picked calendar day as a UTC ISO-8601 bound.
function toIsoParams(startInput: string, endInput: string): AnalyticsDateParams {
  return {
    startDate: startInput ? `${startInput}T00:00:00.000Z` : undefined,
    endDate: endInput ? `${endInput}T23:59:59.999Z` : undefined,
  };
}

const DATE_PRESETS = [
  { label: "7D", apply: () => ({ start: daysAgoInput(6), end: daysAgoInput(0) }) },
  { label: "30D", apply: () => ({ start: daysAgoInput(29), end: daysAgoInput(0) }) },
  { label: "90D", apply: () => ({ start: daysAgoInput(89), end: daysAgoInput(0) }) },
  { label: "YTD", apply: yearToDateInput },
  { label: "All", apply: () => ({ start: "", end: "" }) },
];

export default function AnalyticsPage() {
  const [startInput, setStartInput] = useState(() => daysAgoInput(29));
  const [endInput, setEndInput] = useState(() => daysAgoInput(0));
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("financial");

  const params = useMemo(
    () => toIsoParams(startInput, endInput),
    [startInput, endInput],
  );

  const rangeValid =
    !startInput ||
    !endInput ||
    startInput <= endInput; // YYYY-MM-DD strings compare chronologically

  const enabled = rangeValid;

  const applyPreset = (preset: (typeof DATE_PRESETS)[number]) => {
    const range = preset.apply();
    setStartInput(range.start);
    setEndInput(range.end);
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] space-y-4 bg-background p-1">
      <PageHeader
        header="Executive Analytics"
        subheader="Real-time KPIs, financial performance, operating expenses, inventory velocity, and accounts receivable."
      />

      {/* Global controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-7 px-2 text-xs")}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>From</span>
          <Input
            type="date"
            value={startInput}
            max={endInput || undefined}
            onChange={(event) => setStartInput(event.target.value)}
            className="h-8 w-[140px] font-mono text-xs"
          />
          <span>To</span>
          <Input
            type="date"
            value={endInput}
            min={startInput || undefined}
            onChange={(event) => setEndInput(event.target.value)}
            className="h-8 w-[140px] font-mono text-xs"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {!rangeValid && <InvalidRangeNotice />}

      {/* Section A: KPI cards */}
      <KpiSummaryCards params={params} refreshKey={refreshKey} enabled={enabled} />

      {/* Section B: tabbed analytics */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
        <TabsList className="h-9 w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="financial" className="px-3 text-xs">
            Financial Performance
          </TabsTrigger>
          <TabsTrigger value="expenses" className="px-3 text-xs">
            Operational Expenses
          </TabsTrigger>
          <TabsTrigger value="inventory" className="px-3 text-xs">
            Inventory Velocity
          </TabsTrigger>
          <TabsTrigger value="receivables" className="px-3 text-xs">
            AR & Credit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="pt-3">
          <FinancialPerformanceTab
            params={params}
            refreshKey={refreshKey}
            enabled={enabled}
          />
        </TabsContent>
        <TabsContent value="expenses" className="pt-3">
          <ExpensesTab params={params} refreshKey={refreshKey} enabled={enabled} />
        </TabsContent>
        <TabsContent value="inventory" className="pt-3">
          <InventoryVelocityTab
            params={params}
            refreshKey={refreshKey}
            enabled={enabled}
          />
        </TabsContent>
        <TabsContent value="receivables" className="pt-3">
          <AccountsReceivableTab refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
