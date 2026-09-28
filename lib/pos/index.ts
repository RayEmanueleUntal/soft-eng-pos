// Barrel export for POS lib
export { usePosCart } from "./hooks/use-pos-cart";
export { usePosCatalog, type CatalogProduct } from "./hooks/use-pos-catalog";
export { usePosCustomers, type PosCustomer } from "./hooks/use-pos-customers";
export { usePosShortcuts } from "./hooks/use-pos-shortcuts";

export type * from "./types/pos-types";

export * from "./utils/format-currency";
export * from "./utils/store-config";

export * from "./services/pos-api";
