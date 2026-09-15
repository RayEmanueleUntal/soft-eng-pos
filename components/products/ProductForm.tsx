"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRODUCT_UOMS,
  type Product,
  type ProductFormData,
} from "@/lib/products/types";
import { apiClient } from "@/lib/api";

interface ProductFormProps {
  product?: Product;
  onSaved: () => void;
}

const createEmptyForm = (): ProductFormData => ({
  sku: "",
  name: "",
  categoryId: "",
  size_dimensions: "",
  thread_type: "",
  material_grade: "",

  base_uom: "PCS",
  current_quantity: "0",
  reorder_point_ROP: "0",

  pricing_uom: "PCS",
  pricing_unit_qty: "1",

  cost_price: "0",
  retail_price: "",
  wholesale_price: "",

  binId: "",

  allowDuplicate: false,
  confirmUomChange: false,
});

export function ProductForm({ product, onSaved }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(createEmptyForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(product);

  useEffect(() => {
    if (!product) {
      setFormData(createEmptyForm());
      return;
    }

    setFormData({
      sku: product.sku ?? "",
      name: product.name,
      categoryId: String(product.categoryId),

      size_dimensions: product.size_dimensions ?? "",

      thread_type: product.thread_type ?? "",

      material_grade: product.material_grade ?? "",

      base_uom: product.base_uom,
      current_quantity: String(product.current_quantity),

      reorder_point_ROP: String(product.reorder_point_ROP),

      pricing_uom: product.pricing_uom,

      pricing_unit_qty: String(product.pricing_unit_qty),

      cost_price: String(product.cost_price),
      retail_price: String(product.retail_price),

      wholesale_price:
        product.wholesale_price === null ? "" : String(product.wholesale_price),

      binId: product.binId === null ? "" : String(product.binId),

      allowDuplicate: false,
      confirmUomChange: false,
    });
  }, [product]);

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    const category = Number(formData.categoryId);

    if (!category || category < 1) {
      setError("A valid category ID is required.");
      return;
    }

    const retailPrice = Number(formData.retail_price);

    if (Number.isNaN(retailPrice) || retailPrice < 0) {
      setError("Retail price must be 0 or greater.");
      return;
    }

    const baseQuantity = Number(formData.current_quantity);

    if (Number.isNaN(baseQuantity) || baseQuantity < 0) {
      setError("Current quantity must be 0 or greater.");
      return;
    }

    const reorderPoint = Number(formData.reorder_point_ROP);

    if (Number.isNaN(reorderPoint) || reorderPoint < 0) {
      setError("Reorder point must be 0 or greater.");
      return;
    }

    const pricingUnitQty = Number(formData.pricing_unit_qty);

    if (Number.isNaN(pricingUnitQty) || pricingUnitQty < 1) {
      setError("Pricing unit quantity must be at least 1.");
      return;
    }

    const costPrice = Number(formData.cost_price);

    const wholesalePrice =
      formData.wholesale_price.trim() === ""
        ? undefined
        : Number(formData.wholesale_price);

    if (
      wholesalePrice !== undefined &&
      (Number.isNaN(wholesalePrice) || wholesalePrice < 0)
    ) {
      setError("Wholesale price must be 0 or greater.");
      return;
    }

    const binId =
      formData.binId.trim() === "" ? undefined : Number(formData.binId);

    if (binId !== undefined && (!Number.isInteger(binId) || binId < 1)) {
      setError("Bin ID must be a valid number.");
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        sku: formData.sku.trim() === "" ? undefined : formData.sku.trim(),

        name: formData.name.trim(),

        categoryId: category,

        size_dimensions: formData.size_dimensions.trim() || undefined,

        thread_type: formData.thread_type.trim() || undefined,

        material_grade: formData.material_grade.trim() || undefined,

        base_uom: formData.base_uom,

        reorder_point_ROP: reorderPoint,

        pricing_uom: formData.pricing_uom,

        pricing_unit_qty: pricingUnitQty,

        cost_price: Number.isNaN(costPrice) ? 0 : costPrice,

        retail_price: retailPrice,

        wholesale_price: wholesalePrice,

        binId,

        allowDuplicate: formData.allowDuplicate,
      };

      if (!isEdit) {
        payload.current_quantity = baseQuantity;
      } else {
        /*
         * The PATCH endpoint does not expose
         * current_quantity.
         *
         * Stock should therefore not be modified
         * through product editing.
         */

        if (product && product.base_uom !== formData.base_uom) {
          payload.confirmUomChange = formData.confirmUomChange;
        }
      }

      const idempotencyKey = crypto.randomUUID();

      if (isEdit && product) {
        await apiClient.patch(`/products/${product.id}`, payload, {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        });
      } else {
        await apiClient.post("/products", payload, {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        });
      }

      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const uomOptions = PRODUCT_UOMS.map((uom) => (
    <option key={uom} value={uom}>
      {uom}
    </option>
  ));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            placeholder="e.g. Hex Bolt M8-1.25 x 30mm"
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            placeholder="e.g. BLT-M8-30-SS"
            onChange={(e) => updateField("sku", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to let the backend generate the SKU.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category ID *</Label>
          <Input
            id="categoryId"
            type="number"
            min="1"
            value={formData.categoryId}
            placeholder="e.g. 1"
            onChange={(e) => updateField("categoryId", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size_dimensions">Size / Dimensions</Label>
          <Input
            id="size_dimensions"
            value={formData.size_dimensions}
            placeholder="e.g. M8 x 30mm"
            onChange={(e) => updateField("size_dimensions", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thread_type">Thread Type</Label>
          <Input
            id="thread_type"
            value={formData.thread_type}
            placeholder="e.g. M8x1.25"
            onChange={(e) => updateField("thread_type", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="material_grade">Material / Grade</Label>
          <Input
            id="material_grade"
            value={formData.material_grade}
            placeholder="e.g. Stainless 304"
            onChange={(e) => updateField("material_grade", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 font-semibold">Inventory</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="base_uom">Base UOM</Label>

            <select
              id="base_uom"
              value={formData.base_uom}
              onChange={(e) =>
                updateField(
                  "base_uom",
                  e.target.value as ProductFormData["base_uom"],
                )
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {uomOptions}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_quantity">Initial Quantity</Label>
            <Input
              id="current_quantity"
              type="number"
              min="0"
              value={formData.current_quantity}
              disabled={isEdit}
              onChange={(e) => updateField("current_quantity", e.target.value)}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Use stock adjustment for existing inventory.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder_point_ROP">Reorder Point</Label>
            <Input
              id="reorder_point_ROP"
              type="number"
              min="0"
              value={formData.reorder_point_ROP}
              onChange={(e) => updateField("reorder_point_ROP", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="binId">Bin ID</Label>
            <Input
              id="binId"
              type="number"
              min="1"
              placeholder="Optional"
              value={formData.binId}
              onChange={(e) => updateField("binId", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 font-semibold">Pricing</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pricing_uom">Pricing UOM</Label>

            <select
              id="pricing_uom"
              value={formData.pricing_uom}
              onChange={(e) =>
                updateField(
                  "pricing_uom",
                  e.target.value as ProductFormData["pricing_uom"],
                )
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {uomOptions}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_unit_qty">Pricing Unit Quantity</Label>
            <Input
              id="pricing_unit_qty"
              type="number"
              min="1"
              value={formData.pricing_unit_qty}
              onChange={(e) => updateField("pricing_unit_qty", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_price">Cost Price</Label>
            <Input
              id="cost_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost_price}
              onChange={(e) => updateField("cost_price", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retail_price">Retail Price *</Label>
            <Input
              id="retail_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.retail_price}
              onChange={(e) => updateField("retail_price", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wholesale_price">Wholesale Price</Label>
            <Input
              id="wholesale_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.wholesale_price}
              onChange={(e) => updateField("wholesale_price", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="allowDuplicate"
          type="checkbox"
          checked={formData.allowDuplicate}
          onChange={(e) => updateField("allowDuplicate", e.target.checked)}
          className="h-4 w-4"
        />

        <Label htmlFor="allowDuplicate">
          Allow duplicate product specifications
        </Label>
      </div>

      {isEdit && product && product.base_uom !== formData.base_uom && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <input
              id="confirmUomChange"
              type="checkbox"
              checked={formData.confirmUomChange}
              onChange={(e) =>
                updateField("confirmUomChange", e.target.checked)
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <Label htmlFor="confirmUomChange">Confirm UOM change</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Changing the base UOM requires confirmation and will trigger a
                stock recount.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            loading ||
            (isEdit &&
              product?.base_uom !== formData.base_uom &&
              !formData.confirmUomChange)
          }
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
