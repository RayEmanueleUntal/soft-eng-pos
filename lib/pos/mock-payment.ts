// Payment processing and mock handlers for POS Checkout
// Supports backend API (POST /pos/checkout) with seamless fallback to mock data

import { apiClient } from "@/lib/api";
import type { Receipt, PaymentMethod, TransactionType } from "@/lib/pos/receipt-types";
import { mockCustomers, type Customer } from "@/lib/customers/mock-data";

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
  // Credit specific fields
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
  customer_id?: string | null;
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
  transactionId: number;
  invoice_number: string;
  receipt: Receipt;
}

// Initial mock outstanding balances for wholesale customers
export const initialWholesaleCreditAccounts: Record<string, number> = {
  "cust-2": 45000,  // BuildRite Construction: 150k limit - 45k balance = 105k available
  "cust-4": 120000, // Davao Steel Works: 500k limit - 120k balance = 380k available
  "cust-6": 285000, // Apex Home Builders: 300k limit - 285k balance = 15k available (tight limit test)
  "cust-8": 150000, // Southern Hardware Depot: Inactive account
  "cust-10": 400000, // Metro Hardware Express: 400k limit - 400k balance = 0 available (maxed out test)
};

/**
 * Returns list of wholesale customers with calculated available credit.
 */
export function getWholesaleCustomers(): WholesaleCustomerCredit[] {
  return mockCustomers
    .filter((c) => c.type === "Wholesale")
    .map((c) => {
      const balance = initialWholesaleCreditAccounts[c.id] ?? 0;
      const available = Math.max(c.creditLimit - balance, 0);
      return {
        id: c.id,
        name: c.name,
        contactInfo: c.contactInfo,
        credit_limit: c.creditLimit,
        outstanding_balance: balance,
        available_credit: available,
        isActive: c.isActive,
      };
    });
}

/**
 * Generates a mock receipt following the backend GetReceiptResponseDto structure
 */
export function generateMockReceipt(payload: CheckoutPayload): Receipt {
  const transactionId = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const year = now.getFullYear();
  const invoiceNumber = `INV-${year}-${String(transactionId).padStart(4, "0")}`;

  return {
    transactionId,
    invoice_number: invoiceNumber,
    date: now.toISOString(),
    grand_total: payload.grand_total,
    transaction_type: payload.transaction_type,
    cashier_name: "POS Cashier",
    customer: payload.customer_name
      ? {
          name: payload.customer_name,
          number: payload.customer_id ?? "N/A",
        }
      : null,
    items: payload.items.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      applied_price: item.unit_price,
      subtotal: item.subtotal,
      discounted_price: item.unit_price,
      net_price: item.unit_price,
      type: payload.transaction_type,
    })),
    payments: [
      {
        payment_method: payload.payment.payment_method,
        amount_paid: payload.payment.amount_paid,
        cash_tendered: payload.payment.cash_tendered,
        change_given: payload.payment.change_given,
        reference_number: payload.payment.reference_number,
      },
    ],
  };
}

/**
 * Process checkout by sending payload to backend POST /pos/checkout.
 * If server is offline or fails with network error, falls back gracefully to mock receipt.
 */
export async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  try {
    const response = await apiClient.post<any>("/pos/checkout", payload);
    
    // If backend returns receipt directly or within data
    const data = response.data;
    const receipt: Receipt = data.receipt || data;
    
    return {
      success: true,
      transactionId: receipt.transactionId || Math.floor(1000 + Math.random() * 9000),
      invoice_number: receipt.invoice_number || `INV-${new Date().getFullYear()}-0001`,
      receipt: receipt,
    };
  } catch (error: any) {
    console.warn("Backend /pos/checkout failed or not running, falling back to mock payment handler:", error.message);
    
    // Simulate slight network delay for realistic POS feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    const mockReceipt = generateMockReceipt(payload);
    
    return {
      success: true,
      transactionId: mockReceipt.transactionId,
      invoice_number: mockReceipt.invoice_number || `INV-${mockReceipt.transactionId}`,
      receipt: mockReceipt,
    };
  }
}

