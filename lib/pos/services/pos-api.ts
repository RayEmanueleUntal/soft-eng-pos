// Centralized API Service for POS Module
// Connects to backend endpoints with adapters and typed responses

import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { Receipt, PaymentMethod, TransactionType } from "../types/receipt-types";
import type { CatalogProduct } from "../hooks/use-pos-catalog";
import type { PosCustomer } from "../hooks/use-pos-customers";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface BackendProduct {
  id: number;
  sku?: string | null;
  name: string;
  retail_price?: number | string | null;
  wholesale_price?: number | string | null;
  category?: { name: string } | string | null;
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

export interface CheckoutCartItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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

interface BackendCheckoutResponse {
  receipt?: Receipt;
  transactionId?: number;
  invoice_number?: string | null;
  [key: string]: unknown;
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

// ==========================================
// 2. Data Adapters (Pure Mapping)
// ==========================================

export function toCatalogProduct(item: BackendProduct): CatalogProduct {
  const price = Number(item.retail_price ?? 0);
  const categoryName =
    typeof item.category === "object" && item.category !== null
      ? item.category.name
      : typeof item.category === "string"
      ? item.category
      : "General";

  return {
    id: item.id,
    name: item.name,
    sku: item.sku || `SKU-${item.id}`,
    price,
    retailPrice: price,
    wholesalePrice: Number(item.wholesale_price ?? price),
    category: categoryName,
  };
}

export function toPosCustomer(item: RawBackendCustomer): PosCustomer {
  const isWholesale = item.type?.toUpperCase() === "WHOLESALE";
  const creditLimit = isWholesale ? Number(item.wholesale?.credit_limit ?? 0) : 0;
  const outstandingBalance = isWholesale ? Number(item.wholesale?.outstanding_balance ?? 0) : 0;
  const availableCredit = Math.max(creditLimit - outstandingBalance, 0);

  return {
    id: item.id,
    name: item.name,
    contactNumber: item.contact_number || "",
    type: isWholesale ? "WHOLESALE" : "RETAIL",
    companyName: item.wholesale?.company_name,
    creditLimit,
    outstandingBalance,
    availableCredit,
  };
}

// ==========================================
// 3. API Functions
// ==========================================

/**
 * Fetch and map catalog products from backend API (GET /products).
 */
export async function fetchProductsApi(): Promise<CatalogProduct[]> {
  const response = await apiClient.get<{ data: BackendProduct[] } | BackendProduct[]>("/products");
  const rawList = Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];

  return rawList.map(toCatalogProduct);
}

/**
 * Async API fetcher: queries /customers from backend (GET /customers?limit=100).
 */
export async function fetchCustomersApi(): Promise<PosCustomer[]> {
  const response = await apiClient.get<CustomerApiResponse | RawBackendCustomer[]>("/customers", {
    params: { limit: 100 },
  });

  const rawList = Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];

  return rawList.map(toPosCustomer);
}

/**
 * Submits real checkout payload directly to backend API (POST /pos/checkout).
 */
export async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  try {
    const response = await apiClient.post<BackendCheckoutResponse>("/pos/checkout", payload);
    
    const data = response.data;
    const receipt: Receipt = (data.receipt || data) as unknown as Receipt;
    
    return {
      success: true,
      transactionId: receipt?.transactionId,
      invoice_number: receipt?.invoice_number,
      receipt: receipt,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to process checkout. Please try again."),
    };
  }
}

/**
 * Fetches historical POS transaction logs from backend (GET /pos/transactions).
 */
export async function fetchTransactionsApi(): Promise<TransactionSummary[]> {
  const res = await apiClient.get<TransactionSummary[]>("/pos/transactions");
  return res.data || [];
}

/**
 * Fetches a single receipt by transaction/receipt ID (GET /pos/receipt/:id).
 */
export async function fetchReceiptApi(id: string): Promise<Receipt> {
  const response = await apiClient.get<Receipt>(`/pos/receipt/${id}`);
  return response.data;
}

// Convenient namespace bundle
export const posApi = {
  fetchProducts: fetchProductsApi,
  fetchCustomers: fetchCustomersApi,
  submitCheckout,
  fetchTransactions: fetchTransactionsApi,
  fetchReceipt: fetchReceiptApi,
};

