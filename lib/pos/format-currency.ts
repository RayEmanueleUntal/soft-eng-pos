// Currency and date formatting helpers for POS receipt display (PHP locale).

/** Formats a numeric value as Philippine Peso. */
export function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number.isFinite(value) ? value : 0);
}

/** Formats an ISO date string for receipt headers. */
export function formatReceiptDate(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

  if (Number.isNaN(date.getTime())) {
    return typeof isoDate === 'string' ? isoDate : date.toString();
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Returns true when a number represents a non-zero amount. */
export function hasAmount(value: number): boolean {
  return Number.isFinite(value) && value !== 0;
}
