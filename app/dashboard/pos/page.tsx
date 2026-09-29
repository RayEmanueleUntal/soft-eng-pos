"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentModal, { type PaymentModalItem, type PaymentModalCustomer } from "@/components/pos/PaymentModal";
import { formatPeso } from "@/lib/pos/format-currency";
import { mockCustomers } from "@/lib/customers/mock-data";
import { Input } from "@/components/ui/input";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  User,
  CheckCircle2,
  Barcode
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
  { id: 106, name: "Galvanized Iron Wire #16", sku: "WR-016", price: 85.0, category: "Wire" },
];

export default function PosPage() {
  const [cart, setCart] = useState<PaymentModalItem[]>([
    { id: 101, productId: 101, name: "Portland Cement Type 1 (40kg)", quantity: 10, unitPrice: 280.0, subtotal: 2800.0 },
    { id: 102, productId: 102, name: "Deformed Steel Bar 12mm x 6m", quantity: 20, unitPrice: 345.5, subtotal: 6910.0 },
  ]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-2");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomerData = mockCustomers.find((c) => c.id === selectedCustomerId);
  const selectedCustomer: PaymentModalCustomer | null = selectedCustomerData
    ? {
        id: selectedCustomerData.id,
        name: selectedCustomerData.name,
        type: selectedCustomerData.type,
      }
    : null;

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        // Action for hold could go here
        alert('Hold function activated');
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartTotal > 0) setIsCheckoutOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartTotal]);

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
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-[24px] font-heading font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            POS Terminal
          </h1>
        </div>

        {/* Customer Selector */}
        <div className="flex items-center gap-2.5 bg-card p-2 rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs font-sans">
            <span className="text-muted-foreground block">Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="font-medium text-foreground bg-transparent focus:outline-none cursor-pointer"
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
            <Badge variant={selectedCustomerData.type === "Wholesale" ? "default" : "secondary"} className="rounded-sm">
              {selectedCustomerData.type}
            </Badge>
          )}
        </div>
      </div>

      {lastCompletedSale && (
        <div className="mx-4 mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-[4px] shrink-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>Last transaction ({lastCompletedSale}) completed successfully!</span>
        </div>
      )}

      {/* Main Grid: Catalog and Cart */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 p-3 gap-3 overflow-hidden">
        {/* Left: Quick Catalog / Product Grid */}
        <div className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Barcode className="h-4 w-4 text-muted-foreground/80" />
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Scan Barcode or Search SKU..."
              className="pl-9 h-9 rounded-[4px] border-input focus-visible:ring-0 focus-visible:border-primary focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-[0_0_0_2px_rgba(0,96,178,0.2)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-input bg-muted/80 text-foreground">
                [F2]
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {SAMPLE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addItemToCart(prod)}
                  className="bg-card p-2.5 rounded-[4px] border border-border hover:border-primary transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-[11px] font-mono text-muted-foreground">{prod.sku}</span>
                      <span className="text-[10px] px-1 py-0.5 rounded-[2px] bg-muted border border-border text-muted-foreground">
                        {prod.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-[13px] leading-tight line-clamp-2">{prod.name}</h3>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-primary font-mono text-[13px]">{formatPeso(prod.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: POS Cart & Checkout Trigger */}
        <div className="lg:col-span-4 flex flex-col border border-input bg-card rounded-[4px] overflow-hidden shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
          <div className="h-8 border-b border-border flex justify-between items-center bg-muted px-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase text-muted-foreground font-bold">Line Items ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-destructive hover:text-destructive flex items-center gap-0.5 cursor-pointer font-bold uppercase font-mono"
              >
                <Trash2 className="h-3 w-3" /> Void
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto bg-card">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-muted border-b border-border shadow-sm z-10">
                <tr>
                  <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold w-full">Item</th>
                  <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right">Qty</th>
                  <th className="px-2 py-1 text-[11px] font-mono text-muted-foreground font-semibold text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-muted-foreground text-sm">
                      Register is empty.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr
                      key={item.productId ?? item.id}
                      className={`group h-[32px] border-b border-border last:border-b-0 ${idx % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors`}
                    >
                      <td className="px-2 py-1 max-w-[150px]">
                        <p className="font-medium text-foreground text-[12px] truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          @{formatPeso(item.unitPrice)}
                        </p>
                      </td>

                      {/* Quantity controls */}
                      <td className="px-2 py-1 align-top text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => updateQuantity(item.productId ?? item.id, -1)}
                            className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-[13px] font-mono font-medium text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId ?? item.id, 1)}
                            className="p-0.5 text-muted-foreground hover:text-foreground rounded-[2px] border border-transparent hover:border-input bg-card"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      <td className="px-2 py-1 text-right align-top">
                        <p className="font-semibold text-foreground font-mono text-[13px]">{formatPeso(item.subtotal)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-2.5 border-t border-border bg-background shrink-0 space-y-1">
            <div className="flex justify-between text-[12px] text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatPeso(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-[12px] text-muted-foreground">
              <span>Tax (Included)</span>
              <span className="font-mono">₱0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-input">
              <span>Grand Total</span>
              <span className="text-[18px] text-primary font-mono">{formatPeso(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Command Bar */}
      <div className="h-[48px] bg-secondary-foreground shrink-0 flex items-center px-4 gap-3">
        <button 
          onClick={() => searchInputRef.current?.focus()}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
        >
          <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-white/20 bg-card/10 text-white">
            [F2]
          </span>
          Search
        </button>
        <button 
          onClick={() => alert('Hold function activated')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
        >
          <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-white/20 bg-card/10 text-white">
            [F8]
          </span>
          Hold
        </button>
        <div className="ml-auto">
          <Button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0 || cartTotal <= 0}
            className="h-8 bg-primary hover:bg-primary/80 text-white px-4 text-[13px] font-bold shadow-none rounded-[4px] uppercase"
          >
            Checkout
            <span className="ml-2 inline-flex items-center justify-center px-1.5 h-4 text-[10px] font-mono font-bold rounded-[2px] bg-card/20 text-white border border-white/20">
              [F12]
            </span>
          </Button>
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
