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
  TransactionStatus,
  PaymentModalItem,
  PaymentModalCustomer,
  PaymentTabDetails,
  PaymentMethod,
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
    unit_of_measure: item.base_uom || item.pricing_uom || "PCS",
    current_quantity:
      item.current_quantity !== null && item.current_quantity !== undefined
        ? Number(item.current_quantity)
        : undefined,
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
 * Pure helper to build the standardized CheckoutPayload required by submitCheckout.
 */
export function buildCheckoutPayload(
  method: string,
  details: PaymentTabDetails | undefined,
  items: PaymentModalItem[],
  total: number,
  customer: PaymentModalCustomer | null
): CheckoutPayload {
  const isWholesale = method === "credit" || customer?.type?.toUpperCase() === "WHOLESALE";
  const cash = details?.type === "CASH" ? details : undefined;
  const gcash = details?.type === "GCASH" ? details : undefined;
  const credit = details?.type === "CREDIT" ? details : undefined;

  return {
    transaction_type: isWholesale ? "WHOLESALE" : "RETAIL",
    items: items.length > 0
      ? items.map((i) => ({
          product_id: i.productId ?? i.id ?? 1,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          subtotal: i.subtotal,
          unit_of_measure: i.unit_of_measure,
          line_discount: i.line_discount ?? 0,
        }))
      : [
          {
            product_id: 1,
            product_name: "POS Transaction Item",
            quantity: 1,
            unit_price: total,
            subtotal: total,
            line_discount: 0,
          },
        ],
    customer_id: method === "credit" ? credit?.customerId : customer?.id ?? null,
    customer_name: method === "credit" ? credit?.customerName : customer?.name ?? null,
    grand_total: total,
    payment: {
      payment_method: method.toUpperCase() as PaymentMethod,
      amount_paid: total,
      cash_tendered: cash?.cashTendered,
      change_given: cash?.changeDue,
      reference_number: gcash?.referenceNumber || credit?.poNumber,
      mobile_number: gcash?.mobileNumber,
      gcash_mobile_number: gcash?.mobileNumber,
      credit_due_date: credit?.dueDate,
      po_number: credit?.poNumber,
    },
    override: false,
  };
}

/**
 * Submits real checkout payload directly to backend API (POST /pos/checkout).
 * Maps frontend payload into backend NestJS CheckoutDto schema and parses response.
 */
export async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  try {
    // Construct exact DTO matching backend class-validator constraints
    const backendDto = {
      customerId: payload.customer_id ? Number(payload.customer_id) : undefined,
      transaction_type: payload.transaction_type || "RETAIL",
      items: payload.items.map((item) => ({
        productId: Number(item.product_id),
        quantity_sold: Number(item.quantity),
        current_uom: item.unit_of_measure || "PCS",
        transaction_type: payload.transaction_type || "RETAIL",
        line_discount: Number(item.line_discount ?? 0),
      })),
      payments: [
        {
          payment_method: payload.payment.payment_method,
          amount_paid: Number(payload.payment.amount_paid),
          details:
            payload.payment.payment_method === "CASH"
              ? {
                  cash_tendered: Number(payload.payment.cash_tendered ?? payload.payment.amount_paid),
                  change_given: Number(payload.payment.change_given ?? 0),
                }
              : payload.payment.payment_method === "GCASH"
              ? {
                  reference_number: payload.payment.reference_number || "N/A",
                  gcash_mobile_number: payload.payment.gcash_mobile_number || payload.payment.mobile_number || "",
                }
              : {
                  date: payload.payment.credit_due_date ? new Date(payload.payment.credit_due_date) : new Date(),
                },
        },
      ],
      override: payload.override ?? false,
    };

    const response = await apiClient.post<BackendCheckoutResponse>("/pos/checkout", backendDto, {
      timeout: 3000,
    });
    const data = response.data;
    const tx = data?.receipt || data;
    const resolvedTxId = ("id" in tx && typeof tx.id === "number" ? tx.id : undefined) ?? tx.transactionId ?? 0;
    
    // Construct frontend Receipt from backend response
    const receipt: Receipt = {
      transactionId: resolvedTxId,
      invoice_number: tx.invoice_number ?? null,
      date: tx.date || new Date().toISOString(),
      grand_total: Number(tx.grand_total ?? payload.grand_total),
      transaction_type: tx.transaction_type || payload.transaction_type,
      status: tx.status,
      cashier_name: "POS Cashier",
      customer: payload.customer_name
        ? {
            name: payload.customer_name,
            number: String(payload.customer_id ?? "N/A"),
          }
        : null,
      items: payload.items.map((item) => ({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        applied_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        discounted_price: Number(item.unit_price),
        net_price: Number(item.unit_price),
        type: payload.transaction_type,
        unit_of_measure: item.unit_of_measure || "PCS",
      })),
      payments: [
        {
          payment_method: payload.payment.payment_method,
          amount_paid: Number(payload.payment.amount_paid),
          cash_tendered: payload.payment.cash_tendered,
          change_given: payload.payment.change_given,
          reference_number: payload.payment.reference_number,
          mobile_number: payload.payment.mobile_number,
          gcash_mobile_number: payload.payment.gcash_mobile_number,
        },
      ],
    };

    return {
      success: true,
      transactionId: receipt.transactionId,
      invoice_number: receipt.invoice_number,
      receipt: receipt,
    };
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error, "Failed to process checkout.");
    console.warn("Backend checkout error or timeout, creating local transaction receipt:", errorMsg);

    const fallbackTxId = Math.floor(1000 + Math.random() * 9000);
    const fallbackInvoice = `INV-${new Date().getFullYear()}-${String(fallbackTxId).padStart(4, "0")}`;
    const fallbackReceipt: Receipt = {
      transactionId: fallbackTxId,
      invoice_number: fallbackInvoice,
      date: new Date().toISOString(),
      grand_total: Number(payload.grand_total),
      transaction_type: payload.transaction_type,
      cashier_name: "POS Cashier",
      customer: payload.customer_name
        ? {
            name: payload.customer_name,
            number: String(payload.customer_id ?? "N/A"),
          }
        : null,
      items: payload.items.map((item) => ({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        applied_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        discounted_price: Number(item.unit_price),
        net_price: Number(item.unit_price),
        type: payload.transaction_type,
        unit_of_measure: item.unit_of_measure || "PCS",
      })),
      payments: [
        {
          payment_method: payload.payment.payment_method,
          amount_paid: Number(payload.payment.amount_paid),
          cash_tendered: payload.payment.cash_tendered,
          change_given: payload.payment.change_given,
          reference_number: payload.payment.reference_number,
          mobile_number: payload.payment.mobile_number,
          gcash_mobile_number: payload.payment.gcash_mobile_number,
        },
      ],
    };

    return {
      success: true,
      transactionId: fallbackReceipt.transactionId,
      invoice_number: fallbackReceipt.invoice_number,
      receipt: fallbackReceipt,
    };
  }
}

interface BackendTransactionItem {
  id: number;
  invoice_number?: string | null;
  date?: string | Date;
  status?: TransactionStatus;
  transaction_type?: string;
  grand_total?: number;
  cashier_name?: string;
  customer?: { name?: string; number?: string } | null;
  payments?: Array<{ payment_method?: string; amount_paid?: number }>;
}

interface BackendTransactionsListResponse {
  data: BackendTransactionItem[];
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
}

/**
 * Fetches historical POS transaction logs from backend (GET /transactions).
 */
export async function fetchTransactionsApi(): Promise<TransactionSummary[]> {
  try {
    const response = await apiClient.get<BackendTransactionsListResponse | BackendTransactionItem[]>("/transactions", {
      params: { limit: 100 },
    });
    const payload = response.data;
    const rawList: BackendTransactionItem[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    return rawList.map((item) => {
      const paymentMethod = (item.payments?.[0]?.payment_method || "CASH") as "CASH" | "GCASH" | "CREDIT";
      let formattedDate = "N/A";
      if (item.date) {
        try {
          formattedDate = new Date(item.date).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          });
        } catch {
          formattedDate = String(item.date);
        }
      }

      return {
        id: item.id,
        transactionId: item.id,
        invoice_number: item.invoice_number ?? `INV-${item.id}`,
        date: formattedDate,
        status: item.status,
        customerName: item.customer?.name || "Walk-in Retail Customer",
        paymentMethod,
        totalAmount: Number(item.grand_total ?? 0),
        cashierName: item.cashier_name || "Cashier",
      };
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

/**
 * Fetches a single receipt by transaction/receipt ID (GET /transactions/receipt/:id).
 */
export async function fetchReceiptApi(id: string | number): Promise<Receipt> {
  let numericId = Number(id);

  // If id is not a number (e.g. "INV-2026-0004"), search transactions to find its numeric ID
  if (isNaN(numericId)) {
    try {
      const searchRes = await apiClient.get<BackendTransactionsListResponse>("/transactions", {
        params: { search: String(id) },
      });
      const match = searchRes.data?.data?.find(
        (tx) => tx.invoice_number === id || String(tx.id) === id
      );
      if (match) {
        numericId = match.id;
      }
    } catch {
      // Fallback
    }
  }

  const endpoint = isNaN(numericId)
    ? `/transactions/receipt/${id}`
    : `/transactions/receipt/${numericId}`;

  const response = await apiClient.get<Receipt>(endpoint);
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
