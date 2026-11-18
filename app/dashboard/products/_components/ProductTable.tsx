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
import { TablePagination } from "@/components/ui/table-pagination";
import { ProductForm } from "./ProductForm";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { CheckCircle2, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { mapSortKeyToApiParams, SortKey } from "@/lib/utils/sort";

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
  const [total, setTotal] = useState(0);

  const [sort, setSort] = useState<SortKey>("DEFAULT");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Debounce ONLY text search inputs so dropdowns and pagination fire immediately
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedThread, setDebouncedThread] = useState(thread);
  const [debouncedMaterial, setDebouncedMaterial] = useState(material);
  const [debouncedSize, setDebouncedSize] = useState(size);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setDebouncedThread(thread);
      setDebouncedMaterial(material);
      setDebouncedSize(size);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, thread, material, size]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { sortBy, sortOrder } = mapSortKeyToApiParams(sort);

      const response = await apiClient.get("/products", {
        params: {
          search: debouncedSearch || undefined,
          thread: debouncedThread || undefined,
          material: debouncedMaterial || undefined,
          size: debouncedSize || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          sortBy,
          sortOrder,
          page,
          limit: LIMIT,
        },
      });

      setProducts(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotal(response.data.meta.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    debouncedThread,
    debouncedMaterial,
    debouncedSize,
    categoryId,
    sort,
    page,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 1. Place the auto-dismiss useEffect right here:
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleProductSaved = (createdProduct?: Product) => {
    setBannerError(null);
    setSuccessMsg(
      createdProduct?.name
        ? `Product "${createdProduct.name}" added successfully.`
        : "Product added successfully.",
    );
    fetchProducts();
  };

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
          onCategoryChange={(val) => {
            setCategoryId(val);
            setPage(1);
          }}
          sort={sort}
          onSortChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          actionSlot={<AddProductModal onSaved={handleProductSaved} />}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/*info subheading*/}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Product Profile List
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {total}
        </span>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Retail</TableHead>
              <TableHead>Wholesale</TableHead>
              <TableHead>Actions</TableHead>
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
                  <TableCell className="align-top py-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {product.name}
                        </span>

                        {product.needsRecount && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Recount Required
                          </Badge>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {product.sku ?? "-"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        {product.category_name ||
                          product.category?.name ||
                          (product.categoryId
                            ? `Category #${product.categoryId}`
                            : "-")}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="align-top py-3">
                    <div className="space-y-0.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">Size:</span>{" "}
                        <span className="font-medium text-foreground">
                          {product.size_dimensions || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Thread:</span>{" "}
                        <span className="font-medium text-foreground">
                          {product.thread_type || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Material:</span>{" "}
                        <span className="font-medium text-foreground">
                          {product.material_grade || "-"}
                        </span>
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
                        className="h-7 w-7 rounded-[2px] hover:bg-red-50 hover:text-red-700 inline-flex items-center justify-center"
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
              : `Showing ${products.length} of ${total} products`}
          </TableCaption>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={LIMIT}
        itemLabel="products"
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
