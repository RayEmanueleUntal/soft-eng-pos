"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentModal, { type PaymentModalItem, type PaymentModalCustomer } from "@/components/pos/PaymentModal";
import { formatPeso } from "@/lib/pos/format-currency";
import { mockCustomers } from "@/lib/customers/mock-data";
import {
  CreditCard,
  Minus,
  Plus,
  Receipt as ReceiptIcon,
  ShoppingCart,
  Trash2,
  User,
  CheckCircle2,
} from "lucide-react";

interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  category: string;
}

const SAMPLE_PRODUCTS: CatalogProduct[] = [
  { id: 101, name: "Portland Cement Type 1 (40kg)", sku: "CEM-001", price: 280.0, category: "Masonry" },
  { id: 102, name: "Deformed Steel Bar 12mm x 6m", sku: "STL-012", price: 345.5, category: "Steel" },
  { id: 103, name: "Hex Bolt M8 x 30mm (Box of 50)", sku: "FST-0830", price: 175.0, category: "Fasteners" },
  { id: 104, name: "Heavy Duty Angle Grinder 4-inch", sku: "TLS-004", price: 2850.0, category: "Power Tools" },
  { id: 105, name: "Gloss Latex Paint White (4L)", sku: "PNT-004L", price: 620.0, category: "Paints" },
];

export default function PosPage() {
  const [cart, setCart] = useState<PaymentModalItem[]>([
    { id: 101, productId: 101, name: "Portland Cement Type 1 (40kg)", quantity: 10, unitPrice: 280.0, subtotal: 2800.0 },
    { id: 102, productId: 102, name: "Deformed Steel Bar 12mm x 6m", quantity: 20, unitPrice: 345.5, subtotal: 6910.0 },
  ]);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-2"); // BuildRite (Wholesale)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<string | null>(null);

  const selectedCustomerData = mockCustomers.find((c) => c.id === selectedCustomerId);
  const selectedCustomer: PaymentModalCustomer | null = selectedCustomerData
    ? {
        id: selectedCustomerData.id,
        name: selectedCustomerData.name,
        type: selectedCustomerData.type,
      }
    : null;

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const updateQuantity = (productId: string | number | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.productId ?? item.id) === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter((item): item is PaymentModalItem => item !== null)
    );
  };

  const addItemToCart = (prod: CatalogProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => (item.productId ?? item.id) === prod.id);
      if (existing) {
        return prev.map((item) =>
          (item.productId ?? item.id) === prod.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          id: prod.id,
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          subtotal: prod.price,
        },
      ];
    });
  };

  const clearCart = () => setCart([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[#6366f1]" />
            POS Terminal & Checkout
          </h1>
          <p className="text-sm text-gray-500">
            Hardware & Construction Supplies Cashier Checkout
          </p>
        </div>

        {/* Customer Selector */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border shadow-sm">
          <User className="h-4 w-4 text-gray-400" />
          <div className="text-xs">
            <span className="text-gray-400 block">Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">Walk-in Retail Customer</option>
              {mockCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type}) {c.type === "Wholesale" ? `[Credit: ${formatPeso(c.creditLimit)}]` : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedCustomerData && (
            <Badge variant={selectedCustomerData.type === "Wholesale" ? "default" : "secondary"}>
              {selectedCustomerData.type}
            </Badge>
          )}
        </div>
      </div>

      {lastCompletedSale && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-md">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>Last transaction ({lastCompletedSale}) completed successfully!</span>
        </div>
      )}

      {/* Main Grid: Catalog and Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Catalog / Product Grid */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Quick Add Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addItemToCart(prod)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#6366f1] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono text-gray-400">{prod.sku}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {prod.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1 text-sm">{prod.name}</h3>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                  <span className="font-bold text-gray-900">{formatPeso(prod.price)}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-[#6366f1]">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: POS Cart & Checkout Trigger */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg border shadow-xs overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900 text-sm">Cart Items ({cart.length})</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Cart Item List */}
            <div className="p-4 flex-1 space-y-3 max-h-[380px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Cart is empty. Click products on the left to add items.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId ?? item.id}
                    className="flex items-center justify-between gap-3 text-sm pb-3 border-b last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatPeso(item.unitPrice)} each
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 border rounded-md p-0.5 bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.productId ?? item.id, -1)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId ?? item.id, 1)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <p className="font-semibold text-gray-900">{formatPeso(item.subtotal)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Button */}
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPeso(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (Included)</span>
                  <span>₱0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="text-lg text-[#6366f1]">{formatPeso(cartTotal)}</span>
                </div>
              </div>

              <Button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0 || cartTotal <= 0}
                className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-6 text-base font-semibold shadow-sm cursor-pointer"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Proceed to Checkout ({formatPeso(cartTotal)})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      <PaymentModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartTotal={cartTotal}
        cartItems={cart}
        customer={selectedCustomer}
        onSuccess={(receipt) => {
          setLastCompletedSale(receipt.invoice_number ?? `#${receipt.transactionId}`);
          clearCart();
        }}
      />
    </div>
  );
}

