export interface Forwarder {
  id: string;
  company_name: string;
  tracking_contact_info: string;
  is_active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ForwardersResponse {
  data: Forwarder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}