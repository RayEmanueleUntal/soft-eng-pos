// Computed helpers for receipt refund/exchange totals and receipt status classification.
// Used by both ReceiptModal (on-screen) and PrintableInvoice (thermal print).

import type { Receipt } from "../types/pos-types";

/** Derived receipt status for UI display purposes. */
export type ReceiptDisplayStatus =
  | "FULL_REFUND"
  | "PARTIAL_RETURN"
  | "HAS_EXCHANGES"
  | "NORMAL";

/** Sum of all refund_amount values across the receipt's returns. */
export function computeTotalRefunds(receipt: Receipt): number {
  if (!receipt.returns || receipt.returns.length === 0) return 0;
  return receipt.returns.reduce((sum, r) => sum + (r.refund_amount ?? 0), 0);
}

/** Sum of all price_difference values across the receipt's exchanges. */
export function computeTotalExchangeDifference(receipt: Receipt): number {
  if (!receipt.exchanges || receipt.exchanges.length === 0) return 0;
  return receipt.exchanges.reduce(
    (sum, e) => sum + (e.price_difference ?? 0),
    0
  );
}

/**
 * Computes the adjusted net total after refunds and exchange price differences.
 * Formula: grand_total − total_refunds + total_exchange_differences
 * Floors at zero to prevent negative totals.
 */
export function computeAdjustedTotal(receipt: Receipt): number {
  const refunds = computeTotalRefunds(receipt);
  const exchangeDiff = computeTotalExchangeDifference(receipt);
  return Math.max(0, receipt.grand_total - refunds + exchangeDiff);
}

/** Returns true when the receipt has any returns or exchanges. */
export function hasAdjustments(receipt: Receipt): boolean {
  return (
    (receipt.returns !== undefined && receipt.returns.length > 0) ||
    (receipt.exchanges !== undefined && receipt.exchanges.length > 0)
  );
}

/**
 * Classifies the receipt into a display status for badge rendering.
 * - FULL_REFUND: total refunds >= grand_total
 * - PARTIAL_RETURN: has returns but total refunds < grand_total
 * - HAS_EXCHANGES: has exchanges but no returns
 * - NORMAL: no returns or exchanges
 */
export function getReceiptDisplayStatus(
  receipt: Receipt
): ReceiptDisplayStatus {
  const totalRefunds = computeTotalRefunds(receipt);
  const hasReturns = receipt.returns && receipt.returns.length > 0;
  const hasExchanges = receipt.exchanges && receipt.exchanges.length > 0;

  if (hasReturns && totalRefunds >= receipt.grand_total) {
    return "FULL_REFUND";
  }
  if (hasReturns) {
    return "PARTIAL_RETURN";
  }
  if (hasExchanges) {
    return "HAS_EXCHANGES";
  }
  return "NORMAL";
}
