// Shared TypeScript types for POS receipt data, aligned with the backend
// Prisma schema (Transaction, TransactionItem, Payment, StaffUser, Customer).
// Used by PrintableInvoice, ReceiptModal, and the historical receipt page.

export type PaymentMethod = "CASH" | "GCASH" | "CREDIT";

export type UnitOfMeasure =
  | "PCS"
  | "BOX"
  | "SET"
  | "KG"
  | "G"
  | "METER"
  | "HUNDRED"
  | "GROSS"
  | "SACKs";

export type TransactionType = "RETAIL" | "WHOLESALE";

export type TransactionStatus =
  | "COMPLETED"
  | "PENDING"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface ReceiptProduct {
  name: string;
  sku?: string | null;
}

export interface ReceiptLineItem {
  quantity_sold: string;
  unit_of_measure: UnitOfMeasure;
  unit_price: string;
  discount: string;
  subtotal: string;
  product: ReceiptProduct;
}

export interface CashPaymentDetails {
  cash_tendered: string;
  change_given: string;
}

export interface GCashPaymentDetails {
  reference_number: string;
  gcash_mobile_number: string;
}

export interface CreditPaymentDetails {
  due_date: string;
  remaining_credit_balance: string;
}

export interface ReceiptPayment {
  payment_method: PaymentMethod;
  amount_paid: string;
  cashPayment?: CashPaymentDetails | null;
  gCashPayment?: GCashPaymentDetails | null;
  creditPayment?: CreditPaymentDetails | null;
}

export interface ReceiptStaff {
  first_name: string;
  last_name: string;
}

export interface ReceiptCustomer {
  name: string;
  contact_number?: string;
}

export interface Receipt {
  id: number;
  invoice_number?: string | null;
  date: string;
  status?: TransactionStatus;
  transaction_type: TransactionType;
  subtotal: string;
  tax_total: string;
  discount_total: string;
  grand_total: string;
  staff: ReceiptStaff;
  customer?: ReceiptCustomer | null;
  transactionItems: ReceiptLineItem[];
  payments: ReceiptPayment[];
}
