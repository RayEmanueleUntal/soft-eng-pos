// Shared TypeScript types for Deliveries and Purchase Orders in Inventory Management.

export interface DeliveryItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string | null;
  received_quantity: number;
  received_uom: string;
  uom_conversion_factor: number;
  actual_base_quantity: number;
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

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplierName?: string;
  order_date?: string;
  po_status: string;
  staffId?: number;
  createdByName?: string;
  grand_total?: number;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrdersListResponse {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export interface CreateDeliveryItemPayload {
  productId: number;
  received_quantity: number;
  received_uom: string;
  uom_conversion_factor: number;
  actual_base_quantity: number;
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

