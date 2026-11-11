// API helpers for the Shipments subpage of the POS inventory module.
// Wraps /shipments, GET /forwarders and GET /transactions via apiClient (adds the token and Idempotency-Key).
// Errors are not swallowed; callers pass them through getErrorMessage() for the UI.
import { apiClient } from "@/lib/api";
import {
  CreateShipmentPayload,
  EligibleTransactionsResponse,
  FetchShipmentsParams,
  ForwardersListResponse,
  PaginatedShipments,
  Shipment,
  UpdateShipmentPayload,
  UpdateShipmentStatusPayload,
} from "./shipment-types";

// Only sends filters that have a value.
function buildListParams(params: FetchShipmentsParams) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params.forwarderId ? { forwarderId: params.forwarderId } : {}),
  };
}

// Active deliveries (PENDING or DISPATCHED), oldest dispatch first (GET /shipments/active).
export async function fetchActiveShipments(
  params: FetchShipmentsParams = {},
): Promise<PaginatedShipments> {
  const response = await apiClient.get<PaginatedShipments>(
    "/shipments/active",
    { params: buildListParams(params) },
  );
  return response.data;
}

// Completed deliveries (DELIVERED), newest first (GET /shipments/history).
export async function fetchShipmentHistory(
  params: FetchShipmentsParams = {},
): Promise<PaginatedShipments> {
  const response = await apiClient.get<PaginatedShipments>(
    "/shipments/history",
    { params: buildListParams(params) },
  );
  return response.data;
}

// One shipment with forwarder and transaction summaries (GET /shipments/{id}).
export async function fetchShipmentById(id: number): Promise<Shipment> {
  const response = await apiClient.get<Shipment>(`/shipments/${id}`);
  return response.data;
}

// Logs a new shipment; starts as PENDING (POST /shipments). 409 if the order already has an active one.
export async function createShipment(
  payload: CreateShipmentPayload,
): Promise<Shipment> {
  const response = await apiClient.post<Shipment>("/shipments", payload);
  return response.data;
}

// Edits forwarder, tracking number or notes of a non-delivered shipment (PATCH /shipments/{id}).
export async function updateShipment(
  id: number,
  payload: UpdateShipmentPayload,
): Promise<Shipment> {
  const response = await apiClient.patch<Shipment>(`/shipments/${id}`, payload);
  return response.data;
}

// Moves the shipment to the next status (PATCH /shipments/{id}/status).
export async function updateShipmentStatus(
  id: number,
  payload: UpdateShipmentStatusPayload,
): Promise<Shipment> {
  const response = await apiClient.patch<Shipment>(
    `/shipments/${id}/status`,
    payload,
  );
  return response.data;
}

// Cancels/removes a shipment record (DELETE /shipments/{id}). Returns 204 with no body.
export async function deleteShipment(id: number): Promise<void> {
  await apiClient.delete(`/shipments/${id}`);
}

// Active forwarders for the creation/edit selectors (GET /forwarders).
export async function fetchActiveForwarders(): Promise<ForwardersListResponse> {
  const response = await apiClient.get<ForwardersListResponse>("/forwarders", {
    params: { is_active: true, limit: 100 },
  });
  return response.data;
}

// Completed orders to ship (GET /transactions). includeShipments lets the UI flag orders that already have one.
export async function fetchEligibleTransactions(
  search?: string,
): Promise<EligibleTransactionsResponse> {
  const response = await apiClient.get<EligibleTransactionsResponse>(
    "/transactions",
    {
      params: {
        status: "COMPLETED",
        limit: 10,
        includeShipments: true,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    },
  );
  return response.data;
}