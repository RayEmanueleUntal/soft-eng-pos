// Shared TypeScript types for the Purchase Orders subpage of the POS inventory module.
// Mirrors the backend PurchaseOrderResponseDto, POItemResponseDto and create/status payloads.
// Used by purchase-order-api.ts and the /dashboard/inventory/purchase-orders components.

export const PO_STATUSES = [
  "PENDING",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "CANCELLED",
] as const;

export type POStatus = (typeof PO_STATUSES)[number];

export interface PurchaseOrderItemDto {
  id: number;
  productId: number;
  productName: string;
  sku: string | null;
  requested_quantity: number;
  ordered_uom: string;
  uom_conversion_factor: number;
  expected_base_quantity: number;
  unit_cost: number;
  total_cost: number;
  base_uom: string;
}

export interface PurchaseOrderDto {
  id: number;
  supplierId: number;
  supplierName: string;
  order_date: string;
  po_status: POStatus;
  staffId: number;
  createdByName: string;
  grand_total: number;
  items: PurchaseOrderItemDto[];
}

export interface PaginatedPurchaseOrders {
  data: PurchaseOrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchPurchaseOrderListParams {
  page?: number;
  limit?: number;
  status?: POStatus;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
}

// Minimal shape of GET /deliveries needed to total received base units per product.
export interface PoDeliveryItem {
  productId: number;
  actual_base_quantity: number;
}

export interface PoDeliveriesResponse {
  data: { deliveryItems: PoDeliveryItem[] }[];
}

export interface ProductSearchParams {
  search?: string;
  size?: string;
  thread?: string;
  material?: string;
  limit?: number;
}

export interface CreatePurchaseOrderItemPayload {
  productId: number;
  requested_quantity: number;
  ordered_uom?: string;
  uom_conversion_factor?: number;
  unit_cost?: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: number;
  items: CreatePurchaseOrderItemPayload[];
}
