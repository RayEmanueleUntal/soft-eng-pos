// Centralized TypeScript domain and API types for the POS module.
// Aligned with backend Prisma schema models and enums.

// ==========================================
// 1. Enums & Primitives
// ==========================================
export type PaymentMethod = "CASH" | "GCASH" | "CREDIT";
export type TransactionType = "RETAIL" | "WHOLESALE";

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

export type TransactionStatus =
  | "COMPLETED"
  | "PENDING"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

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
  unit_of_measure?: UnitOfMeasure | string;
  current_quantity?: number;
}

export interface BackendProduct {
  id: number;
  sku?: string | null;
  name: string;
  retail_price?: number | string | null;
  wholesale_price?: number | string | null;
  category?: { name: string } | string | null;
  base_uom?: UnitOfMeasure | string | null;
  pricing_uom?: UnitOfMeasure | string | null;
  current_quantity?: number | string | null;
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
  unit_of_measure?: UnitOfMeasure | string;
}

export interface PaymentDetails {
  type: PaymentMethod;
  amount: number;
  cashTendered?: number;
  changeDue?: number;
  referenceNumber?: string;
  mobileNumber?: string;
  gcash_mobile_number?: string;
  customerId?: string;
  customerName?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  availableCredit?: number;
  dueDate?: string;
  poNumber?: string;
  isValid?: boolean;
}

export type PaymentTabDetails =
  | {
      type: "CASH";
      amount: number;
      cashTendered: number;
      changeDue?: number;
      isValid?: boolean;
      errorMessage?: string;
    }
  | {
      type: "GCASH";
      amount: number;
      referenceNumber: string;
      mobileNumber: string;
      isValid?: boolean;
      errorMessage?: string;
    }
  | {
      type: "CREDIT";
      amount: number;
      customerId?: string | number;
      customerName?: string;
      creditLimit?: number;
      outstandingBalance?: number;
      availableCredit?: number;
      dueDate?: string;
      poNumber?: string;
      isValid: boolean;
      errorMessage?: string;
    };

export interface PaymentModalItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit_of_measure?: string;
  line_discount?: number;
}

export interface PaymentModalCustomer {
  id: string | number;
  name: string;
  type?: "Retail" | "Wholesale" | "RETAIL" | "WHOLESALE";
}

export interface CheckoutPayload {
  transaction_type: TransactionType;
  items: Array<{
    product_id: string | number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    unit_of_measure?: UnitOfMeasure | string;
    line_discount?: number;
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
    gcash_mobile_number?: string;
    credit_due_date?: string;
    po_number?: string;
  };
  override?: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  message?: string;
  transactionId?: number;
  invoice_number?: string | null;
  receipt?: Receipt;
}

export interface BackendCheckoutResponse {
  id?: number;
  receipt?: Receipt;
  transactionId?: number;
  invoice_number?: string | null;
  date?: string | Date;
  grand_total?: number;
  transaction_type?: TransactionType;
  status?: TransactionStatus;
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
  unit_of_measure?: UnitOfMeasure | string;
}

export interface ReceiptPayment {
  payment_method: PaymentMethod;
  amount_paid: number;
  cash_tendered?: number;
  change_given?: number;
  reference_number?: string;
  mobile_number?: string;
  gcash_mobile_number?: string;
}

export interface Receipt {
  transactionId: number;
  invoice_number: string | null;
  date: Date | string;
  grand_total: number;
  transaction_type: TransactionType;
  status?: TransactionStatus;
  cashier_name: string;
  customer: ReceiptCustomer | null;
  items: ReceiptItem[];
  payments: ReceiptPayment[];
}

export interface TransactionSummary {
  id: string | number;
  invoice_number?: string;
  transactionId?: string | number;
  date: string;
  status?: TransactionStatus;
  customerName: string;
  paymentMethod: "CASH" | "GCASH" | "CREDIT";
  totalAmount: number;
  cashierName?: string;
}
