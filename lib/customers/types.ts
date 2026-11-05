export type CustomerType = "RETAIL" | "WHOLESALE";

export interface WholesaleCustomer {
  customerId: number;
  company_name: string;
  credit_limit: number;
  outstanding_balance: number;
}

export interface Customer {
  id: number;
  name: string;
  contact_number: string;
  type: CustomerType;
  wholesale: WholesaleCustomer | null;
  createdAt: string;
}

export interface CustomerResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerFilters {
  search: string;
  name: string;
  contact_number: string;
  type: CustomerType | "";
  company_name: string;
}

export const EMPTY_CUSTOMER_FILTERS: CustomerFilters = {
  search: "",
  name: "",
  contact_number: "",
  type: "",
  company_name: "",
};

export interface CustomerPayload {
  name: string;
  contact_number: string;
  type: CustomerType;
  company_name?: string;
  credit_limit?: number;
}

export type SettlementPaymentMethod = "CASH" | "GCASH";
export type CustomerPaymentMethod = SettlementPaymentMethod | "CREDIT";

export interface CustomerOverdueStatus {
  customerId: number;
  hasOverdue: boolean;
  overdueCount: number;
  totalOverdueAmount: number;
}

export interface CreateCustomerPaymentPayload {
  amount_paid: number;
  payment_method: SettlementPaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface CustomerPayment {
  id: number;
  wholesaleCustId: number;
  staffId: number;
  amount_paid: number;
  payment_method: CustomerPaymentMethod;
  reference_number?: string;
  payment_date: string;
  notes?: string;
  previous_balance: number;
  new_balance: number;
}
