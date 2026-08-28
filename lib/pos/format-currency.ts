// Currency and date formatting helpers for POS receipt display (PHP locale).

/** Formats a numeric or decimal-string value as Philippine Peso. */
export function formatPeso(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number.isFinite(num) ? num : 0);
}

/** Formats an ISO date string for receipt headers. */
export function formatReceiptDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Returns true when a decimal string represents a non-zero amount. */
export function hasAmount(value: string): boolean {
  const num = parseFloat(value);
  return Number.isFinite(num) && num !== 0;
}
