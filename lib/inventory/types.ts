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
