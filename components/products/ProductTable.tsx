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
import type { Product } from "@/lib/products/types";

import { ProductSearch } from "./ProductSearch";
import { ProductPagination } from "./ProductPagination";
import { ProductForm } from "./ProductForm";
import { DeleteProductDialog } from "./DeleteProductDialog";

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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load products.");
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

  const handleSaved = () => {
    setIsEditOpen(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) {
      return "-";
    }

    return `₱${Number(price).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

        <AddProductModal onSaved={fetchProducts} />
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
                    {product.category?.name || product.categoryId}
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
                      per {product.pricing_uom}
                    </div>
                  </TableCell>

                  <TableCell>
                    {formatPrice(product.wholesale_price)}
                    <div className="text-xs text-muted-foreground">
                      per {product.pricing_uom}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1">
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
        onDeleted={fetchProducts}
      />
    </div>
  );
}
