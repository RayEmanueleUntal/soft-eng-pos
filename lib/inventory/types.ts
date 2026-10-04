// Shared TypeScript types for the Inventory Management module of the POS system.
// Mirrors the backend inventory, category and bin-location response DTOs.
// Used by the inventory, ROP and adjustments pages and their components.
export interface InventoryItem {
  id: number;
  sku: string | null;
  name: string;
  categoryId: number;

  size_dimensions: string | null;
  thread_type: string | null;
  material_grade: string | null;

  base_uom: string;
  current_quantity: number;
  reorder_point_ROP: number;
  needsRecount: boolean;

  pricing_uom: string;
  pricing_unit_qty: number;

  cost_price: number;
  retail_price: number;
  wholesale_price: number | null;

  binId: number | null;
  bin_aisle_number: string | null;
  bin_shelf_location: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryResponse {
  data: InventoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductCategory {
  id: number;
  categoryName: string;
}

export type MovementType = "IN" | "OUT" | "SALE" | "RETURN" | "ADJUSTMENT";

// One row of the session-only movement log shown on the adjustments page.
export interface StockMovementLogEntry {
  id: number;
  date: string;
  sku: string | null;
  productName: string;
  type: MovementType;
  uom: string;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  staffId: number;
}

export interface BinLocation {
  id: number;
  aisle_number: string;
  shelf_location: string;
}

export interface BinLocationsResponse {
  data: BinLocation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
