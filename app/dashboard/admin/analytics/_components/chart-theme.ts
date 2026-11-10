// Shared Recharts palette for the analytics dashboard.
// Muted industrial tones that stay legible on the light POS theme.

export const CHART_COLORS = {
  revenue: "#2563eb",
  netProfit: "#059669",
  grid: "#e5e7eb",
  axis: "#6b7280",
} as const;

export const DONUT_PALETTE = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
  "#db2777",
  "#475569",
  "#9333ea",
] as const;

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "#059669",
  GCASH: "#2563eb",
  CREDIT: "#d97706",
  CHECK: "#475569",
  BANK_TRANSFER: "#7c3aed",
  UNCATEGORIZED: "#9ca3af",
};

export function colorForIndex(index: number): string {
  return DONUT_PALETTE[index % DONUT_PALETTE.length];
}
