// Mock receipt data for developing PrintableInvoice and ReceiptModal without API calls.
// Mirrors the backend Prisma schema shape for local UI testing.

import type { Receipt } from "@/lib/pos/receipt-types";

export const mockReceipt: Receipt = {
  id: 42,
  invoice_number: "INV-2026-0042",
  date: new Date().toISOString(),
  status: "COMPLETED",
  transaction_type: "RETAIL",
  subtotal: "295.00",
  tax_total: "35.40",
  discount_total: "5.00",
  grand_total: "325.40",
  staff: {
    first_name: "Mary",
    last_name: "Santos",
  },
  customer: null,
  transactionItems: [
    {
      quantity_sold: "2.000",
      unit_of_measure: "PCS",
      unit_price: "50.00",
      discount: "5.00",
      subtotal: "95.00",
      product: {
        name: "Hex Bolt M8 x 30mm",
        sku: "BLT-m8-30-SS",
      },
    },
    {
      quantity_sold: "2.500",
      unit_of_measure: "KG",
      unit_price: "80.00",
      discount: "0.00",
      subtotal: "200.00",
      product: {
        name: "Stainless Nuts Assorted",
      },
    },
  ],
  payments: [
    {
      payment_method: "CASH",
      amount_paid: "325.40",
      cashPayment: {
        cash_tendered: "500.00",
        change_given: "174.60",
      },
    },
  ],
};
