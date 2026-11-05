import { apiClient } from "@/lib/api";
import type {
  CreateCustomerPaymentPayload,
  Customer,
  CustomerFilters,
  CustomerOverdueStatus,
  CustomerPayload,
  CustomerPayment,
  CustomerResponse,
} from "./types";

export interface GetCustomersParams extends Partial<CustomerFilters> {
  page?: number;
  limit?: number;
}

export async function getCustomers(
  params: GetCustomersParams = {},
): Promise<CustomerResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };

  const search = params.search?.trim();
  const name = params.name?.trim();
  const contactNumber = params.contact_number?.trim();
  const companyName = params.company_name?.trim();

  if (search) query.search = search;
  if (name) query.name = name;
  if (contactNumber) query.contact_number = contactNumber;
  if (params.type) query.type = params.type;
  if (companyName) query.company_name = companyName;

  const response = await apiClient.get<CustomerResponse>("/customers", {
    params: query,
  });

  return response.data;
}

export async function getCustomerOverdueStatus(
  customerId: number,
): Promise<CustomerOverdueStatus> {
  const response = await apiClient.get<CustomerOverdueStatus>(
    `/customers/wholesale/${customerId}/overdue-status`,
  );

  return response.data;
}

export async function collectCustomerPayment(
  customerId: number,
  payload: CreateCustomerPaymentPayload,
): Promise<CustomerPayment> {
  const response = await apiClient.post<CustomerPayment>(
    `/customers/wholesale/${customerId}/payments`,
    payload,
  );

  return response.data;
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await apiClient.post<Customer>("/customers", payload);
  return response.data;
}

export async function updateCustomer(
  id: number,
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(`/customers/${id}`, payload);
  return response.data;
}
