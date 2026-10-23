// Shared TypeScript types for Deliveries and Purchase Orders in Inventory Management.

export interface DeliveryItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string | null;
  received_quantity: number;
}

export interface DeliveryRecord {
  id: number;
  poId: number;
  delivery_date: string;
  staffId: number;
  staffName?: string;
  deliveryItems: DeliveryItem[];
}

export interface DeliveriesListResponse {
  data: DeliveryRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseOrderItem {
  productId: number;
  productName?: string;
  productSku?: string | null;
  requested_quantity: number;
  received_quantity?: number;
  unit_cost?: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber?: string;
  supplierId: number;
  supplierName?: string;
  status: "ACTIVE" | "PENDING" | "PARTIALLY_FULFILLED" | "FULFILLED" | string;
  items: PurchaseOrderItem[];
  createdAt?: string;
}

export interface CreateDeliveryItemPayload {
  productId: number;
  received_quantity: number;
}

export interface CreateDeliveryPayload {
  poId: number;
  items: CreateDeliveryItemPayload[];
}

export interface CreateDeliveryResponse {
  message: string;
  isPartial: boolean;
  delivery: DeliveryRecord;
}

