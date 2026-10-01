import { apiClient } from "@/lib/api"

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

export async function stockIn(params: StockInParams): Promise<StockMovementResponse> {
  try {
    const response = await apiClient.post<StockMovementResponse>("/inventory/stock-in", params)
    return response.data
  } catch (error) {
    console.error("Failed to record stock-in:", error)
    throw new Error("Failed to record stock-in. Please try again.")
  }
}

export async function stockOut(params: StockOutParams): Promise<StockMovementResponse> {
  try {
    const response = await apiClient.post<StockMovementResponse>("/inventory/stock-out", params)
    return response.data
  } catch (error) {
    console.error("Failed to record stock-out:", error)
    throw new Error("Failed to record stock-out. Please try again.")
  }
}