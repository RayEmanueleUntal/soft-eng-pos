import { apiClient } from "@/lib/api"
import { InventoryItem } from "./types"

interface ROPResponse {
  items: InventoryItem[]
  totalAlerts: number
}

export async function fetchROPItems(): Promise<InventoryItem[]> {
  try {
    const response = await apiClient.get<ROPResponse>("/inventory/rop")
    return response.data.items
  } catch (error) {
    console.error("Failed to fetch ROP items:", error)
    throw new Error("Failed to load ROP data. Please try again.")
  }
}