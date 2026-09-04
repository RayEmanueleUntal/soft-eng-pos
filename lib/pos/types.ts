export type CustomerType = "RETAIL" | "WHOLESALE";
export type PricingTier = "RETAIL" | "WHOLESALE";
export type PaymentMethod = "CASH" | "GCASH" | "CREDIT";

export interface POSCustomer {
  customerId: number;
  name: string;
  contact_number: string;
  type: CustomerType;
}

export interface POSProduct {
  id: string | number;
  name: string;
  barcode: string;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  category?: string;
}

export interface POSCartItem {
  product: POSProduct;
  quantity: number;
  selectedPriceType: PricingTier;
  unitPrice: number;
  discount: number;
}

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

export interface POSCheckoutPayload {
  customerId: number | null;
  transactionType: PricingTier;
  items: {
    productId: string | number;
    quantity: number;
    priceType: PricingTier;
    unitPrice: number;
    discount: number;
  }[];
  payments: PaymentEntry[];
}