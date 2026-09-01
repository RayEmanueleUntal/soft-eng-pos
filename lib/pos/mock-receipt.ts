// Mock receipt data for developing PrintableInvoice and ReceiptModal without API calls.
// Mirrors the backend GetReceiptResponseDto structure for local UI testing.

import type { Receipt } from "@/lib/pos/receipt-types";

export const mockReceipt: Receipt = {
  transactionId: 42,
  invoice_number: "INV-2026-0042",
  date: new Date().toISOString(),
  grand_total: 325.40,
  transaction_type: "RETAIL",
  cashier_name: "Mary Santos",
  customer: null,
  items: [
    {
      product_name: "Hex Bolt M8 x 30mm",
      quantity: 2,
      applied_price: 50.00,
      subtotal: 100.00,
      discounted_price: 95.00,
      net_price: 95.00,
      type: "RETAIL"
    },
    {
      product_name: "Stainless Nuts Assorted",
      quantity: 2.5,
      applied_price: 80.00,
      subtotal: 200.00,
      discounted_price: 200.00,
      net_price: 200.00,
      type: "RETAIL"
    }
  ],
  payments: [
    {
      payment_method: "CASH",
      amount_paid: 325.40,
      cash_tendered: 500.00,
      change_given: 174.60
    }
  ]
};
