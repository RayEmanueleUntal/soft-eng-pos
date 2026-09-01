// Shared TypeScript types for POS receipt data, aligned with the backend
// GetReceiptResponseDto structure.
// Used by PrintableInvoice, ReceiptModal, and the historical receipt page.

export type PaymentMethod = "CASH" | "GCASH" | "CREDIT";
export type TransactionType = "RETAIL" | "WHOLESALE";

export interface ReceiptCustomer {
  name: string;
  number: string;
}

export interface ReceiptItem {
  product_name: string;
  quantity: number;
  applied_price: number;
  subtotal: number;
  discounted_price: number;
  net_price: number;
  type: TransactionType;
}

export interface ReceiptPayment {
  payment_method: PaymentMethod;
  amount_paid: number;
  cash_tendered?: number;
  change_given?: number;
  reference_number?: string;
}

export interface Receipt {
  transactionId: number;
  invoice_number: string | null;
  date: Date | string;
  grand_total: number;
  transaction_type: TransactionType;
  cashier_name: string;
  customer: ReceiptCustomer | null;
  items: ReceiptItem[];
  payments: ReceiptPayment[];
}
