// Centralized API Service for POS Module
// Connects to backend endpoints with adapters and typed responses

import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type {
  Receipt,
  BackendProduct,
  CatalogProduct,
  RawBackendCustomer,
  PosCustomer,
  CustomerApiResponse,
  CheckoutPayload,
  CheckoutResponse,
  BackendCheckoutResponse,
  TransactionSummary,
} from "../types/pos-types";

// Re-export all types so consumers can import types and service functions together
export type * from "../types/pos-types";

// ==========================================
// 1. Data Adapters (Pure Mapping)
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
// 2. API Functions
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
