// API helpers for the Purchase Orders subpage of the POS inventory module.
// Wraps /purchase-orders, GET /products and GET /deliveries (received totals) via apiClient.
// Errors are not swallowed; callers pass them through getErrorMessage() for the UI.
import { apiClient } from "@/lib/api";
import { InventoryResponse } from "./types";
import {
  CreatePurchaseOrderPayload,
  FetchPurchaseOrderListParams,
  PaginatedPurchaseOrders,
  PoDeliveriesResponse,
  POStatus,
  ProductSearchParams,
  PurchaseOrderDto,
} from "./purchase-order-types";

// Fetches one page of purchase orders (GET /purchase-orders) with optional status filter.
export async function fetchPurchaseOrderList(
  params: FetchPurchaseOrderListParams = {},
): Promise<PaginatedPurchaseOrders> {
  const response = await apiClient.get<PaginatedPurchaseOrders>(
    "/purchase-orders",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        status: params.status,
        supplierId: params.supplierId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    },
  );
  return response.data;
}

// Fetches a single purchase order with its line items (GET /purchase-orders/{id}).
export async function fetchPurchaseOrderDetail(
  id: number,
): Promise<PurchaseOrderDto> {
  const response = await apiClient.get<PurchaseOrderDto>(
    `/purchase-orders/${id}`,
  );
  return response.data;
}

// Creates a purchase order (POST /purchase-orders); apiClient adds the Idempotency-Key header.
export async function createPurchaseOrder(
  payload: CreatePurchaseOrderPayload,
): Promise<PurchaseOrderDto> {
  const response = await apiClient.post<PurchaseOrderDto>(
    "/purchase-orders",
    payload,
  );
  return response.data;
}

// Changes a purchase order's status (PATCH /purchase-orders/{id}/status), e.g. to CANCELLED.
export async function updatePurchaseOrderStatus(
  id: number,
  po_status: POStatus,
): Promise<PurchaseOrderDto> {
  const response = await apiClient.patch<PurchaseOrderDto>(
    `/purchase-orders/${id}/status`,
    { po_status },
  );
  return response.data;
}

// Totals received base units per product across every delivery of a PO (GET /deliveries?poId=).
export async function fetchReceivedBaseByProduct(
  poId: number,
): Promise<Record<number, number>> {
  const response = await apiClient.get<PoDeliveriesResponse>("/deliveries", {
    params: { poId, limit: 100 },
  });
  const received: Record<number, number> = {};
  response.data.data.forEach((delivery) => {
    delivery.deliveryItems.forEach((item) => {
      received[item.productId] =
        (received[item.productId] ?? 0) + Number(item.actual_base_quantity);
    });
  });
  return received;
}

// Searches products by SKU/name plus size, thread and material filters (GET /products) for manual PO lines.
export async function searchProducts(
  params: ProductSearchParams,
): Promise<InventoryResponse> {
  const response = await apiClient.get<InventoryResponse>("/products", {
    params: {
      search: params.search || undefined,
      size: params.size || undefined,
      thread: params.thread || undefined,
      material: params.material || undefined,
      limit: params.limit ?? 8,
    },
  });
  return response.data;
}
