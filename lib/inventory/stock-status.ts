// Stock status rule for the Inventory Management module of the POS system.
// An item is low stock when its quantity is at or below its reorder point (ROP).
// Used by the inventory and ROP tables and the status badge.
import { InventoryItem } from "./types"

export type StockStatusType = "low-stock" | "adequate-stock"

// Returns "low-stock" when current quantity is at or below the reorder point.
export function getStockStatus(item: InventoryItem): StockStatusType {
  return item.current_quantity <= item.reorder_point_ROP 
    ? "low-stock" 
    : "adequate-stock"
}