"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AddProductModal } from "./AddProductModal";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { Product } from "@/lib/products/types";

import { ProductSearch } from "./ProductSearch";
import { ProductPagination } from "./ProductPagination";
import { ProductForm } from "./ProductForm";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { CheckCircle2, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LIMIT = 15;

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [thread, setThread] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/products", {
        params: {
          search: searchTerm || undefined,
          thread: thread || undefined,
          material: material || undefined,
          size: size || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          page,
          limit: LIMIT,
        },
      });

      setProducts(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, thread, material, size, categoryId, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, thread, material, size, categoryId]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, thread, material, size, categoryId]);

  // 1. Place the auto-dismiss useEffect right here:
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleSaved = (updatedProduct?: Product) => {
    const productName = selectedProduct?.name;

    setIsEditOpen(false);
    setSelectedProduct(null);
    setBannerError(null);
    setSuccessMsg(
      productName
        ? `Product "${productName}" updated successfully.`
        : "Product updated successfully.",
    );
    fetchProducts();
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) {
      return "-";
    }

    return `₱${Number(price).toFixed(2)}`;
  };

  const renderAltUoms = (product: Product) => {
    const uoms = product.uoms ?? [];
    if (uoms.length === 0) return null;

    const visible = uoms.slice(0, 2);

    return (
      <div className="mt-1.5 space-y-0.5 border-t pt-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Alt UoMs
        </div>
        {visible.map((uom) => (
          <div
            key={uom.id ?? uom.uom}
            className="font-mono text-[11px] leading-4 text-muted-foreground"
          >
            {uom.uom} ×{uom.conversion_factor} · cost{" "}
            {formatPrice(uom.calculated_cost_price)} · retail{" "}
            {formatPrice(uom.calculated_retail_price)} · wholesale{" "}
            {formatPrice(uom.calculated_wholesale_price)}
          </div>
        ))}
        {uoms.length > 2 && (
          <div className="text-[11px] text-muted-foreground">
            +{uoms.length - 2} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {bannerError && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-red-50 border border-red-200 text-red-700 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{bannerError}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerError(null)}
            className="text-red-700 hover:text-red-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          thread={thread}
          onThreadChange={setThread}
          material={material}
          onMaterialChange={setMaterial}
          size={size}
          onSizeChange={setSize}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
        />

        <AddProductModal
          onSaved={(createdProduct) => {
            setBannerError(null);
            setSuccessMsg(
              createdProduct?.name
                ? `Product "${createdProduct.name}" added successfully.`
                : "Product added successfully.",
            );
            fetchProducts();
          }}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Retail</TableHead>
              <TableHead>Wholesale</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>

                    {product.needsRecount && (
                      <Badge variant="destructive" className="mt-1">
                        Recount Required
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {product.sku || "-"}
                  </TableCell>

                  <TableCell>
                    {product.category_name ||
                      product.category?.name ||
                      product.categoryId}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Size:</span>{" "}
                        {product.size_dimensions || "-"}
                      </div>

                      <div>
                        <span className="font-medium">Thread:</span>{" "}
                        {product.thread_type || "-"}
                      </div>

                      <div>
                        <span className="font-medium">Material:</span>{" "}
                        {product.material_grade || "-"}
                      </div>

                      {renderAltUoms(product)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {product.current_quantity}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {product.base_uom}
                    </div>

                    {product.current_quantity <= product.reorder_point_ROP && (
                      <Badge variant="secondary" className="mt-1">
                        Low Stock
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {formatPrice(product.retail_price)}
                    <div className="text-xs text-muted-foreground">
                      per {product.base_uom}
                    </div>
                  </TableCell>

                  <TableCell>
                    {formatPrice(product.wholesale_price)}
                    <div className="text-xs text-muted-foreground">
                      per {product.base_uom}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsEditOpen(true);
                        }}
                        title="Edit product"
                      >
                        <Pencil />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToDelete(product)}
                        title="Delete product"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableCaption>
            {loading
              ? "Loading product catalog..."
              : `${products.length} products shown`}
          </TableCaption>
        </Table>
      </div>

      <ProductPagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setPage}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <ProductForm product={selectedProduct} onSaved={handleSaved} />
          )}
        </DialogContent>
      </Dialog>

      <DeleteProductDialog
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onDeleted={(deletedProduct) => {
          setBannerError(null);
          setSuccessMsg(
            `Product "${deletedProduct.name}" deleted successfully.`,
          );
          fetchProducts();
        }}
        onError={(msg) => setBannerError(msg)}
      />
    </div>
  );
}
