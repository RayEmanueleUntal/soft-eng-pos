// lib/bin-locations.ts
import { apiClient } from "@/lib/api";

export interface BinLocation {
  id: number;
  aisle_number: string;
  shelf_location: string;
}

export interface BinLocationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetBinLocationsResponse {
  data: BinLocation[];
  meta: BinLocationMeta;
}

export interface CreateBinPayload {
  aisle_number: string;
  shelf_location: string;
}

export interface GetBinLocationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SearchBinParams {
  aisle_number: string;
  shelf_location: string;
}

/**
 * GET /bin-location
 * Retrieves paginated list of bin locations
 */
export async function getBinLocations(
  params: GetBinLocationsParams = {}
): Promise<GetBinLocationsResponse> {
  const response = await apiClient.get<GetBinLocationsResponse>("/bin-location", {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return response.data;
}

/**
 * POST /bin-location
 * Creates a new bin location.
 * Handled Exceptions: 403 Forbidden, 409 Conflict
 */
export async function createBinLocation(
  payload: CreateBinPayload
): Promise<BinLocation> {
  const response = await apiClient.post<BinLocation>("/bin-location", payload);
  return response.data;
}

/**
 * GET /bin-location/search
 * Exact lookup by aisle_number and shelf_location.
 * Handled Exception: 404 Not Found
 */
export async function searchBinLocationExact(
  params: SearchBinParams
): Promise<BinLocation> {
  const response = await apiClient.get<BinLocation>("/bin-location/search", {
    params,
  });
  return response.data;
}