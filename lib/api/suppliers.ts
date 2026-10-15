import { apiClient } from "@/lib/api";

export interface Supplier {
  id: string | number;
  name?: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  contact_info?: string;
  leadTimeDays?: number;
  lead_time_days?: number;
  status?: "ACTIVE" | "INACTIVE" | string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuppliersResponse {
  data: Supplier[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
}

export interface SupplierFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  status?: string;
}

// Maps backend schema (snake_case) to UI frontend expectations
function mapSupplier(s: any): Supplier {
  if (!s) return s;

  let person = "N/A";
  let phone = "";
  let email = "";

  const rawContact = s.contact_info || "";
  if (rawContact) {
    const parts = rawContact.split("|").map((p: string) => p.trim());
    if (parts.length === 3) {
      person = parts[0] || "N/A";
      phone = parts[1] || "";
      email = parts[2] || "";
    } else if (parts.length === 2) {
      if (parts[0].startsWith("+") || /^\d/.test(parts[0])) {
        person = "N/A";
        phone = parts[0];
        email = parts[1];
      } else {
        person = parts[0];
        phone = parts[1];
      }
    } else {
      person = rawContact;
    }
  }

  // Handle boolean is_active or string status for UI badge display
  let statusStr = "ACTIVE";
  if (s.status) {
    statusStr = s.status;
  } else if (typeof s.is_active === "boolean") {
    statusStr = s.is_active ? "ACTIVE" : "INACTIVE";
  }

  return {
    ...s,
    companyName: s.name || s.companyName || "",
    name: s.name || s.companyName || "",
    contactPerson: person,
    phone: phone || "N/A",
    email: email || "N/A",
    address: s.location || s.address || "",
    location: s.location || s.address || "",
    leadTimeDays: s.lead_time_days ?? s.leadTimeDays ?? 0,
    lead_time_days: s.lead_time_days ?? s.leadTimeDays ?? 0,
    contact_info: s.contact_info || "",
    status: statusStr,
  };
}

export async function fetchSuppliers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  // Map UI status ('ACTIVE' | 'INACTIVE' | 'ALL') to backend boolean query 'is_active'
  let isActiveParam: boolean | undefined = undefined;
  if (params?.status === "ACTIVE" || params?.status === "true") {
    isActiveParam = true;
  } else if (params?.status === "INACTIVE" || params?.status === "false") {
    isActiveParam = false;
  }

  const response = await apiClient.get<SuppliersResponse | Supplier[]>("/suppliers", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search || undefined,
      is_active: isActiveParam,
    },
  });

  if (Array.isArray(response.data)) {
    const mapped = response.data.map(mapSupplier);
    return {
      data: mapped,
      total: mapped.length,
      totalPages: 1,
    };
  }

  const items = response.data.data || [];
  return {
    data: items.map(mapSupplier),
    total: response.data.meta?.total ?? response.data.total ?? 0,
    totalPages: response.data.meta?.totalPages ?? 1,
  };
}

export async function createSupplier(data: SupplierFormData) {
  const contactParts = [data.contactPerson, data.phone, data.email].filter(Boolean);
  const contactInfo = contactParts.length > 0 ? contactParts.join(" | ") : "N/A";

  const payload = {
    name: data.companyName,
    contact_info: contactInfo,
    location: data.address || "N/A",
    lead_time_days: Number(data.leadTimeDays) || 0,
  };

  const response = await apiClient.post<Supplier>("/suppliers", payload);
  return mapSupplier(response.data);
}

export async function fetchSupplierById(id: string | number) {
  const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
  return mapSupplier(response.data);
}

export async function updateSupplier(id: string | number, data: Partial<SupplierFormData>) {
  const payload: Record<string, any> = {};

  if (data.companyName !== undefined) payload.name = data.companyName;

  if (data.contactPerson !== undefined || data.phone !== undefined || data.email !== undefined) {
    const contactParts = [data.contactPerson, data.phone, data.email].filter(Boolean);
    payload.contact_info = contactParts.join(" | ");
  }

  if (data.address !== undefined) payload.location = data.address;
  if (data.leadTimeDays !== undefined) payload.lead_time_days = Number(data.leadTimeDays) || 0;

  const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, payload);
  return mapSupplier(response.data);
}

export async function deleteSupplier(id: string | number) {
  const response = await apiClient.delete(`/suppliers/${id}`);
  return response.data;
}