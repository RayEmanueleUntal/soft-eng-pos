import { apiClient } from "@/lib/api";

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  contact_number?: string | null;
  location: string;
  lead_time_days: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Frontend display aliases
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  leadTimeDays?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface PaginatedSuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierFormData {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address: string;
  leadTimeDays: number;
  status?: string;
}

/**
 * Maps NestJS backend DTO (snake_case) to UI expected fields
 */
function mapSupplier(s: any): Supplier {
  if (!s) return s;

  const isActive = typeof s.is_active === "boolean" ? s.is_active : true;

  return {
    ...s,
    companyName: s.name || s.companyName || "",
    contactPerson: s.contact_person || s.contactPerson || "",
    phone: s.contact_number || s.phone || "",
    email: s.email || "",
    address: s.location || s.address || "",
    leadTimeDays: s.lead_time_days ?? s.leadTimeDays ?? 0,
    status: isActive ? "ACTIVE" : "INACTIVE",
  };
}

export async function fetchSuppliers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ data: Supplier[]; total: number; totalPages: number }> {
  let isActiveParam: boolean | undefined = undefined;
  if (params?.status === "ACTIVE" || params?.status === "true") {
    isActiveParam = true;
  } else if (params?.status === "INACTIVE" || params?.status === "false") {
    isActiveParam = false;
  }

  const response = await apiClient.get<PaginatedSuppliersResponse>(
    "/suppliers",
    {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search || undefined,
        is_active: isActiveParam,
      },
    },
  );

  const items = response.data.data || [];
  return {
    data: items.map(mapSupplier),
    total: response.data.total ?? 0,
    totalPages: response.data.totalPages ?? 1,
  };
}

export async function createSupplier(
  data: SupplierFormData,
): Promise<Supplier> {
  const payload = {
    name: data.companyName,
    contact_person: data.contactPerson || undefined,
    email: data.email || undefined,
    contact_number: data.phone || undefined,
    location: data.address,
    lead_time_days: Number(data.leadTimeDays) || 0,
    is_active: data.status ? data.status === "ACTIVE" : true,
  };

  const response = await apiClient.post<Supplier>("/suppliers", payload);
  return mapSupplier(response.data);
}

export async function fetchSupplierById(
  id: string | number,
): Promise<Supplier> {
  const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
  return mapSupplier(response.data);
}

export async function updateSupplier(
  id: string | number,
  data: Partial<SupplierFormData>,
): Promise<Supplier> {
  const payload: Record<string, any> = {};

  if (data.companyName !== undefined) payload.name = data.companyName;
  if (data.contactPerson !== undefined)
    payload.contact_person = data.contactPerson || null;
  if (data.email !== undefined) payload.email = data.email || null;
  if (data.phone !== undefined) payload.contact_number = data.phone || null;
  if (data.address !== undefined) payload.location = data.address;
  if (data.leadTimeDays !== undefined)
    payload.lead_time_days = Number(data.leadTimeDays) || 0;
  if (data.status !== undefined) payload.is_active = data.status === "ACTIVE";

  const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, payload);
  return mapSupplier(response.data);
}

export async function deleteSupplier(
  id: string | number,
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/suppliers/${id}`,
  );
  return response.data;
}
