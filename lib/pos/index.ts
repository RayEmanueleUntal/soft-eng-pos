// Barrel export for POS lib
export { usePosCart } from "./hooks/use-pos-cart";
export { usePosCatalog, type CatalogProduct } from "./hooks/use-pos-catalog";
export { usePosShortcuts } from "./hooks/use-pos-shortcuts";

export type * from "./types/receipt-types";

export * from "./utils/format-currency";
export * from "./utils/store-config";

export * from "./mock/mock-payment";
export * from "./mock/mock-receipt";
