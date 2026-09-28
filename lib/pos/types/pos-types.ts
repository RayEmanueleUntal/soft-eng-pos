// Centralized TypeScript domain and API types for the POS module.

// ==========================================
// 1. Payment & Transaction Primitives
// ==========================================
export type PaymentMethod = "CASH" | "GCASH" | "CREDIT";
export type TransactionType = "RETAIL" | "WHOLESALE";

// ==========================================
// 2. Product Catalog Types
// ==========================================
export interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  category: string;
  retailPrice?: number;
  wholesalePrice?: number;
}

export interface BackendProduct {
  id: number;
  sku?: string | null;
  name: string;
  retail_price?: number | string | null;
  wholesale_price?: number | string | null;
  category?: { name: string } | string | null;
}

// ==========================================
// 3. Customer & Credit Types
// ==========================================
export interface PosCustomer {
  id: number;
  name: string;
  contactNumber: string;
  type: "RETAIL" | "WHOLESALE";
  companyName?: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
}

export interface RawBackendCustomer {
  id: number;
  name: string;
  contact_number?: string;
  type: "RETAIL" | "WHOLESALE" | string;
  wholesale?: {
    customerId: number;
    company_name: string;
    credit_limit: number | string;
    outstanding_balance: number | string;
  } | null;
}

export interface CustomerApiResponse {
  data: RawBackendCustomer[];
  total?: number;
}

export interface WholesaleCustomerCredit {
  id: string;
  name: string;
  contactInfo: string;
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number;
  isActive: boolean;
}

// ==========================================
// 4. Checkout & Cart Types
// ==========================================
export interface CheckoutCartItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentDetails {
  type: PaymentMethod;
  amount: number;
  cashTendered?: number;
  changeDue?: number;
  referenceNumber?: string;
  mobileNumber?: string;
  customerId?: string;
  customerName?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  availableCredit?: number;
  dueDate?: string;
  poNumber?: string;
  isValid?: boolean;
}

export interface CheckoutPayload {
  transaction_type: TransactionType;
  items: Array<{
    product_id: string | number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  customer_id?: string | number | null;
  customer_name?: string | null;
  grand_total: number;
  payment: {
    payment_method: PaymentMethod;
    amount_paid: number;
    cash_tendered?: number;
    change_given?: number;
    reference_number?: string;
    mobile_number?: string;
    credit_due_date?: string;
    po_number?: string;
  };
}

export interface CheckoutResponse {
  success: boolean;
  message?: string;
  transactionId?: number;
  invoice_number?: string | null;
  receipt?: Receipt;
}

export interface BackendCheckoutResponse {
  receipt?: Receipt;
  transactionId?: number;
  invoice_number?: string | null;
  [key: string]: unknown;
}

// ==========================================
// 5. Receipt & Transaction Log Types
// ==========================================
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

export interface TransactionSummary {
  id: string;
  invoice_number?: string;
  transactionId?: string;
  date: string;
  customerName: string;
  paymentMethod: "CASH" | "GCASH" | "CREDIT";
  totalAmount: number;
  cashierName?: string;
}
