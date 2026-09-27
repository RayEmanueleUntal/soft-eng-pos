// Barrel export for POS components
export { PosHeader } from "./PosHeader";
export { PosCommandBar } from "./PosCommandBar";

// Cart
export { PosCart } from "./cart/PosCart";
export { CartItemRow } from "./cart/CartItemRow";
export { CartSummary } from "./cart/CartSummary";

// Catalog
export { PosCatalog } from "./catalog/PosCatalog";
export type { CatalogProduct } from "./catalog/PosCatalog";
export { ProductCard } from "./catalog/ProductCard";

// Payment
export { default as PaymentModal } from "./payment/PaymentModal";
export type { PaymentModalItem, PaymentModalCustomer } from "./payment/PaymentModal";
export { default as CashPaymentForm } from "./payment/CashPaymentForm";
export { default as GCashPaymentForm } from "./payment/GCashPaymentForm";
export { default as CreditPaymentForm } from "./payment/CreditPaymentForm";

// Receipt
export { ReceiptModal } from "./receipt/ReceiptModal";
export { PrintableInvoice } from "./receipt/PrintableInvoice";
