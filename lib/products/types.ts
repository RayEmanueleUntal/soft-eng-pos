// Types for the Products module, aligned with the backend product DTOs.
// Mirrors ProductItemResponseDto (GET /products list) and ProductResponseDto (GET /products/:id).

export const PRODUCT_UOMS = [
  "PCS",
  "BOX",
  "SET",
  "KG",
  "G",
  "METER",
  "HUNDRED",
  "GROSS",
  "SACK",
  "SACKs",
] as const;

export type UnitOfMeasure = (typeof PRODUCT_UOMS)[number];

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductBinLocation {
  id: number;
  aisle_number: string;
  shelf_location: string;
}

// Alternate UoM as returned by the backend (explicit overrides + calculated prices).
export interface ProductUomEntry {
  id?: number;
  productId?: number;
  uom: UnitOfMeasure;
  conversion_factor: number;
  cost_price: number | null;
  retail_price: number | null;
  wholesale_price: number | null;
  calculated_cost_price: number;
  calculated_retail_price: number;
  calculated_wholesale_price: number | null;
  is_default_purchase: boolean;
  is_default_sales: boolean;
}

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  categoryId: number;

  // Present on GET /products/:id; the list endpoint returns category_name instead.
  category?: ProductCategory | null;
  category_name?: string | null;

  size_dimensions: string | null;
  thread_type: string | null;
  material_grade: string | null;

  base_uom: UnitOfMeasure;
  current_quantity: number;
  reorder_point_ROP: number;
  needsRecount: boolean;

  // Base UoM prices.
  cost_price: number;
  retail_price: number;
  wholesale_price: number | null;

  binId: number | null;

  // Present on GET /products/:id.
  bin_location?: ProductBinLocation | null;

  // Present on GET /products list items.
  bin_aisle_number?: string | null;
  bin_shelf_location?: string | null;

  uoms: ProductUomEntry[];

  createdAt?: string;
  updatedAt?: string;
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

// Editable row for the alternate-UoM section of the product form.
export interface ProductUomFormRow {
  key: string;
  uom: UnitOfMeasure | "";
  conversion_factor: string;
  cost_price: string;
  retail_price: string;
  wholesale_price: string;
  is_default_purchase: boolean;
  is_default_sales: boolean;
}

// Request shape sent to POST /products and PATCH /products/:id.
export interface ProductUomPayload {
  uom: UnitOfMeasure;
  conversion_factor: number;
  cost_price?: number;
  retail_price?: number;
  wholesale_price?: number;
  is_default_purchase?: boolean;
  is_default_sales?: boolean;
}

export interface ProductFormData {
  sku: string;
  name: string;
  categoryId: string;
  size_dimensions: string;
  thread_type: string;
  material_grade: string;

  base_uom: UnitOfMeasure;
  current_quantity: string;
  reorder_point_ROP: string;

  // Base UoM prices.
  cost_price: string;
  retail_price: string;
  wholesale_price: string;

  binId: string;

  uoms: ProductUomFormRow[];

  allowDuplicate: boolean;
  confirmUomChange: boolean;
}
