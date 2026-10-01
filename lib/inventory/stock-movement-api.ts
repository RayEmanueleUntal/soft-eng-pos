// API client for stock movements in the Inventory Management module of the POS system.
// Wraps POST /inventory/stock-in, /stock-out and /adjust, throwing the backend's message on failure.
// Staff identity is taken from the auth token by the backend, so no staff id is sent.
import { apiClient } from "@/lib/api"
import { getApiErrorMessage } from "./api-error"

export interface StockInParams {
  productId: number
  current_uom: string
  added_qty: number
  reason?: string
  date?: Date
}

export interface StockOutParams {
  productId: number
  current_uom: string
  taken_qty: number
  reason?: string
  date?: Date
  allowOverride?: boolean
}

export interface AdjustInventoryParams {
  productId: number
  current_uom: string
  new_count: number
  reason: string
  date?: Date
}

export interface StockMovementResponse {
  id: number
  productId: number
  date: Date
  type: string
  current_uom: string
  quantity_changed: number
  previous_quantity: number
  new_quantity: number
  isOverride: boolean
  reason: string
  staffId: number
  approvedById: number | null
}

// Records received stock for a product.
export async function stockIn(params: StockInParams): Promise<StockMovementResponse> {
  try {
    const response = await apiClient.post<StockMovementResponse>("/inventory/stock-in", params)
    return response.data
  } catch (error) {
    console.error("Failed to record stock-in:", error)
    throw new Error(getApiErrorMessage(error, "Failed to record stock-in. Please try again."))
  }
}

// Records dispatched stock for a product.
export async function stockOut(params: StockOutParams): Promise<StockMovementResponse> {
  try {
    const response = await apiClient.post<StockMovementResponse>("/inventory/stock-out", params)
    return response.data
  } catch (error) {
    console.error("Failed to record stock-out:", error)
    throw new Error(getApiErrorMessage(error, "Failed to record stock-out. Please try again."))
  }
}

// Corrects a product's stock to a newly counted absolute quantity (not a delta).
export async function adjustInventory(params: AdjustInventoryParams): Promise<StockMovementResponse> {
  try {
    const response = await apiClient.post<StockMovementResponse>("/inventory/adjust", params)
    return response.data
  } catch (error) {
    console.error("Failed to adjust inventory:", error)
    throw new Error(getApiErrorMessage(error, "Failed to adjust stock. Please try again."))
  }
}
