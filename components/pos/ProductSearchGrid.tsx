"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { POSProduct } from "@/lib/pos/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductSearchGridProps {
  onAddToCart: (product: POSProduct) => void;
}

export function ProductSearchGrid({ onAddToCart }: ProductSearchGridProps) {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch products from backend POS endpoint with mock fallback
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/pos/products");
      if (Array.isArray(response.data) && response.data.length > 0) {
        setProducts(response.data);
      } else {
        throw new Error("Empty or invalid backend product list");
      }
    } catch (error) {
      console.warn("Backend unavailable or route missing, using mock products:", error);
      setProducts([
        {
          id: 1,
          name: "Hex Bolt M8 x 20mm",
          barcode: "10001",
          retail_price: 15.0,
          wholesale_price: 10.0,
          stock_quantity: 150,
        },
        {
          id: 2,
          name: "Flange Nut M6",
          barcode: "10002",
          retail_price: 8.5,
          wholesale_price: 5.0,
          stock_quantity: 200,
        },
        {
          id: 3,
          name: "Steel Washer 1/2 inch",
          barcode: "10003",
          retail_price: 5.0,
          wholesale_price: 3.0,
          stock_quantity: 500,
        },
        {
          id: 4,
          name: "Concrete Nail 3 inch",
          barcode: "10004",
          retail_price: 12.0,
          wholesale_price: 8.0,
          stock_quantity: 80,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Barcode scanner listener: automatically adds matching barcode item
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      const currentTime = Date.now();

      // Barcode scanners type rapidly (< 100ms between keys)
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (barcodeBuffer.length > 2) {
          const matchedProduct = products.find(
            (p) => p.barcode?.toLowerCase() === barcodeBuffer.toLowerCase()
          );
          if (matchedProduct) {
            onAddToCart(matchedProduct);
            setSearchQuery("");
            barcodeBuffer = "";
            e.preventDefault();
          }
        }
      } else if (e.key.length === 1 && !isInputFocused) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, onAddToCart]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search product by name or scan barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-sm text-muted-foreground">
          Loading catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg bg-card">
          No products match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const retailPrice = Number(product.retail_price || 0);
            const wholesalePrice = Number(product.wholesale_price || 0);

            return (
              <div
                key={product.id}
                className="border rounded-lg p-3 bg-card flex flex-col justify-between hover:border-primary transition-colors cursor-pointer shadow-sm"
                onClick={() => onAddToCart(product)}
              >
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    #{product.barcode}
                  </span>
                  <h4 className="font-semibold text-sm line-clamp-2 mt-0.5">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="text-muted-foreground">Retail:</span>
                    <span className="font-semibold">₱{retailPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-purple-700">
                    <span>Wholesale:</span>
                    <span className="font-semibold">₱{wholesalePrice.toFixed(2)}</span>
                  </div>

                  <div className="mt-2 flex justify-between items-center text-[11px] pt-2 border-t text-muted-foreground">
                    <span>Stock: {product.stock_quantity}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-[11px] px-2"
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}