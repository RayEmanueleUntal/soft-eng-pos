// API helpers for the Reorder Point (ROP) screens of the POS inventory module.
// Loads items at or below their ROP and saves a product's new reorder point.
// Saving uses PATCH /products/{id}, which only ADMIN, MANAGER and SECRETARY may call.
import { apiClient } from "@/lib/api"
import { InventoryItem } from "./types"
import { getApiErrorMessage } from "./api-error"

interface ROPResponse {
  items: InventoryItem[]
  totalAlerts: number
}

// Fetches the items whose quantity is at or below their reorder point.
export async function fetchROPItems(): Promise<InventoryItem[]> {
  try {
    const response = await apiClient.get<ROPResponse>("/inventory/rop")
    return response.data.items
  } catch (error) {
    console.error("Failed to fetch ROP items:", error)
    throw new Error("Failed to load ROP data. Please try again.")
  }
}

// Saves a new reorder point for one product; throws an Error with a readable message on failure.
export async function updateReorderPoint(
  productId: number,
  reorderPoint: number
): Promise<void> {
  try {
    await apiClient.patch(`/products/${productId}`, {
      reorder_point_ROP: reorderPoint,
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update the reorder point."))
  }
}
