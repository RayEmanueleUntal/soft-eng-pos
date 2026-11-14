// Types for the Shipments subpage of the POS inventory module.
// Mirrors the backend DTOs (ShipmentResponseDto, PaginatedShipmentsResponseDto, forwarder and transaction lists).

export type TrackingStatus = "PENDING" | "DISPATCHED" | "DELIVERED";

export interface ShipmentForwarder {
  id: number;
  company_name: string;
  tracking_contact_info: string;
}

export interface ShipmentTransaction {
  id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
}

export interface Shipment {
  id: number;
  transactionId: number;
  forwarderId: number;
  tracking_number: string | null;
  dispatch_date: string;
  tracking_status: TrackingStatus;
  notes: string | null;
  forwarder: ShipmentForwarder | null;
  transaction: ShipmentTransaction | null;
  createdAt: string;
  updatedAt: string;
}

// Shipment lists use a different meta shape than forwarders/transactions.
export interface ShipmentListMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginatedShipments {
  items: Shipment[];
  meta: ShipmentListMeta;
}

export interface FetchShipmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  forwarderId?: number;
}

export interface CreateShipmentPayload {
  transactionId: number;
  forwarderId: number;
  tracking_number?: string;
  notes?: string;
}

export interface UpdateShipmentPayload {
  forwarderId?: number;
  tracking_number?: string;
  notes?: string;
}

export interface UpdateShipmentStatusPayload {
  status: TrackingStatus;
  notes?: string;
}

export interface Forwarder {
  id: number;
  company_name: string;
  tracking_contact_info: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForwardersListResponse {
  data: Forwarder[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface EligibleTransaction {
  id: number;
  invoice_number: string | null;
  date: string;
  status: string;
  grand_total: number;
  customer: { name: string } | null;
  shipments?: { id: number; tracking_status: TrackingStatus }[];
}

export interface EligibleTransactionsResponse {
  data: EligibleTransaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}