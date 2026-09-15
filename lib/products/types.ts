export const PRODUCT_UOMS = [
  "PCS",
  "BOX",
  "SET",
  "KG",
  "G",
  "METER",
  "HUNDRED",
  "GROSS",
  "SACKs",
] as const;

export type ProductUom = (typeof PRODUCT_UOMS)[number];

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductBinLocation {
  id: number;
  aisle_number: string;
  shelf_location: string;
}

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  categoryId: number;

  category?: ProductCategory;

  size_dimensions: string | null;
  thread_type: string | null;
  material_grade: string | null;

  base_uom: ProductUom;
  current_quantity: number;
  reorder_point_ROP: number;
  needsRecount: boolean;

  pricing_uom: ProductUom;
  pricing_unit_qty: number;

  cost_price: number;
  retail_price: number;
  wholesale_price: number | null;

  binId: number | null;

  bin_location?: ProductBinLocation | null;

  bin_aisle_number?: string | null;
  bin_shelf_location?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFormData {
  sku: string;
  name: string;
  categoryId: string;
  size_dimensions: string;
  thread_type: string;
  material_grade: string;

  base_uom: ProductUom;
  current_quantity: string;
  reorder_point_ROP: string;

  pricing_uom: ProductUom;
  pricing_unit_qty: string;

  cost_price: string;
  retail_price: string;
  wholesale_price: string;

  binId: string;

  allowDuplicate: boolean;
  confirmUomChange: boolean;
}
