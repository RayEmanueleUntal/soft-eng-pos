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
