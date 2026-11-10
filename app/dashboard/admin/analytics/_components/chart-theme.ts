// Chart colors resolve to the semantic --chart-* design tokens defined in
// app/globals.css, so analytics charts follow the app theme (light/dark).

export const CHART_COLORS = {
  revenue: "var(--chart-1)",
  netProfit: "var(--chart-2)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
} as const;

export const DONUT_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "var(--chart-2)",
  GCASH: "var(--chart-1)",
  CREDIT: "var(--chart-3)",
  CHECK: "var(--chart-9)",
  BANK_TRANSFER: "var(--chart-5)",
  UNCATEGORIZED: "var(--chart-10)",
};

export function colorForIndex(index: number): string {
  return DONUT_PALETTE[index % DONUT_PALETTE.length];
}
