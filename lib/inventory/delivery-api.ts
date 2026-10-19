import { apiClient } from "@/lib/api";
import {
  DeliveriesListResponse,
  DeliveryRecord,
  CreateDeliveryPayload,
  CreateDeliveryResponse,
  PurchaseOrder,
} from "./delivery-types";

export interface FetchDeliveriesParams {
  page?: number;
  limit?: number;
  poId?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches historical delivery logs with pagination and optional filters.
 * Endpoint: GET /deliveries
 */
export async function fetchDeliveries(
  params: FetchDeliveriesParams = {},
): Promise<DeliveriesListResponse> {
  const response = await apiClient.get<DeliveriesListResponse>("/deliveries", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.poId ? { poId: params.poId } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
    },
  });
  return response.data;
}

/**
 * Fetches a single delivery record and its itemized breakdown by ID.
 * Endpoint: GET /deliveries/{id}
 */
export async function fetchDeliveryById(id: number): Promise<DeliveryRecord> {
  const response = await apiClient.get<DeliveryRecord>(`/deliveries/${id}`);
  return response.data;
}

/**
 * Records an incoming delivery against a Purchase Order.
 * Automatically attaches Idempotency-Key and Bearer token via apiClient interceptor.
 * Endpoint: POST /deliveries
 */
export async function createDelivery(
  payload: CreateDeliveryPayload,
): Promise<CreateDeliveryResponse> {
  const response = await apiClient.post<CreateDeliveryResponse>(
    "/deliveries",
    payload,
  );
  return response.data;
}

/**
 * Fetches purchase orders to allow searching and selecting active POs for stock-in.
 * Endpoint: GET /purchase-orders
 */
export async function fetchPurchaseOrders(
  params: { status?: string; search?: string } = {},
): Promise<PurchaseOrder[]> {
  try {
    const response = await apiClient.get<
      PurchaseOrder[] | { data: PurchaseOrder[] }
    >("/purchase-orders", {
      params,
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray((response.data as { data: PurchaseOrder[] }).data)) {
      return (response.data as { data: PurchaseOrder[] }).data;
    }
    return [];
  } catch (err) {
    console.warn("fetchPurchaseOrders fallback:", err);
    return [];
  }
}

/**
 * Fetches a specific Purchase Order by ID.
 * Endpoint: GET /purchase-orders/{id}
 */
export async function fetchPurchaseOrderById(id: number): Promise<PurchaseOrder> {
  const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  return response.data;
}

