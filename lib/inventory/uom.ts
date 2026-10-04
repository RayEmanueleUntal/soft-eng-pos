// Unit-of-measure helpers for the Inventory Management module of the POS system.
// Decides whether a quantity input should accept decimals for a given base UOM.
// Used by the stock-in, stock-out and adjustment modals.

const DECIMAL_UOMS = ["KG", "G", "METER"];

// Returns true if quantities in this UOM may have a fractional part.
export function allowsDecimals(uom: string): boolean {
  return DECIMAL_UOMS.includes(uom.toUpperCase());
}

// Rounds away floating-point noise (for example 0.1 + 0.2) for display and checks.
export function roundQty(value: number): number {
  return Math.round(value * 10000) / 10000;
}
