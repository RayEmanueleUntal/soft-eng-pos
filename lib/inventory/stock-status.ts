import { InventoryItem } from "./types"

export type StockStatusType = "low-stock" | "adequate-stock"

export function getStockStatus(item: InventoryItem): StockStatusType {
  return item.current_quantity <= item.reorder_point_ROP 
    ? "low-stock" 
    : "adequate-stock"
}