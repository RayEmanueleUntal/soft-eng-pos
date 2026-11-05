"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRODUCT_UOMS,
  type Product,
  type ProductFormData,
  type ProductUomFormRow,
  type ProductUomPayload,
  type UnitOfMeasure,
} from "@/lib/products/types";
import { useProductCategories } from "@/lib/products/product-categories";
import { apiClient } from "@/lib/api";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { BinLocationSelect } from "./BinLocationSelect";

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

  cost_price: "0",
  retail_price: "",
  wholesale_price: "",

  binId: "",

  uoms: [],

  allowDuplicate: false,
  confirmUomChange: false,
});

const createUomRow = (): ProductUomFormRow => ({
  key: crypto.randomUUID(),
  uom: "",
  conversion_factor: "",
  cost_price: "",
  retail_price: "",
  wholesale_price: "",
  is_default_purchase: false,
  is_default_sales: false,
});

const toNumberOrNull = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

// Mirrors the backend calculated_* fallback: explicit override, else base price x factor.
const effectiveUomPrice = (
  override: string,
  base: number | null,
  factor: number,
): number | null => {
  const explicit = toNumberOrNull(override);
  if (explicit !== null) return explicit;
  if (base === null || !Number.isFinite(factor) || factor <= 0) return null;
  return round2(base * factor);
};

const formatEffective = (value: number | null) =>
  value === null ? "—" : formatPeso(value);

export function ProductForm({ product, onSaved }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(createEmptyForm);
  const [binLabel, setBinLabel] = useState("");
  const [editDetail, setEditDetail] = useState<Product | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { categories, loading: categoriesLoading, error: categoriesError } =
    useProductCategories();

  const isEdit = Boolean(product);

  const initFromProduct = (source: Product) => {
    const binLabelFromProduct = source.bin_location
      ? `Aisle ${source.bin_location.aisle_number} · Shelf ${source.bin_location.shelf_location}`
      : source.bin_aisle_number || source.bin_shelf_location
        ? `Aisle ${source.bin_aisle_number ?? "-"} · Shelf ${source.bin_shelf_location ?? "-"}`
        : source.binId
          ? `Bin #${source.binId}`
          : "";

    setBinLabel(binLabelFromProduct);

    setFormData({
      sku: source.sku ?? "",
      name: source.name,
      categoryId: String(source.categoryId),

      size_dimensions: source.size_dimensions ?? "",

      thread_type: source.thread_type ?? "",

      material_grade: source.material_grade ?? "",

      base_uom: source.base_uom,
      current_quantity: String(source.current_quantity),

      reorder_point_ROP: String(source.reorder_point_ROP),

      cost_price: String(source.cost_price),
      retail_price: String(source.retail_price),

      wholesale_price:
        source.wholesale_price === null ? "" : String(source.wholesale_price),

      binId: source.binId === null ? "" : String(source.binId),

      uoms: (source.uoms ?? []).map((uom, index) => ({
        key: `uom-${uom.id ?? index}`,
        uom: uom.uom,
        conversion_factor: String(uom.conversion_factor),
        cost_price: uom.cost_price === null ? "" : String(uom.cost_price),
        retail_price: uom.retail_price === null ? "" : String(uom.retail_price),
        wholesale_price:
          uom.wholesale_price === null ? "" : String(uom.wholesale_price),
        is_default_purchase: uom.is_default_purchase,
        is_default_sales: uom.is_default_sales,
      })),

      allowDuplicate: false,
      confirmUomChange: false,
    });
  };

  // Fetch the authoritative product detail on edit so the full alternate-UoM
  // set and bin relation come from GET /products/:id, not the list item.
  useEffect(() => {
    if (!product) {
      setEditDetail(null);
      setDetailError(null);
      return;
    }

    let mounted = true;
    setEditDetail(null);
    setDetailError(null);

    apiClient
      .get<Product>(`/products/${product.id}`)
      .then((res) => {
        if (mounted) setEditDetail(res.data);
      })
      .catch((err: unknown) => {
        // Fall back to the list item, which still carries the uoms array,
        // but surface the failure so staff know the data may be stale.
        if (mounted) {
          setEditDetail(product);
          setDetailError(
            getErrorMessage(err, "Failed to load the latest product details."),
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [product, detailReloadKey]);

  const retryDetail = () => {
    setEditDetail(null);
    setDetailError(null);
    setDetailReloadKey((key) => key + 1);
  };

  useEffect(() => {
    if (isEdit) {
      if (editDetail) initFromProduct(editDetail);
      return;
    }

    setFormData(createEmptyForm());
    setBinLabel("");
  }, [isEdit, editDetail]);

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addUomRow = () => {
    setFormData((previous) => ({
      ...previous,
      uoms: [...previous.uoms, createUomRow()],
    }));
  };

  const removeUomRow = (key: string) => {
    setFormData((previous) => ({
      ...previous,
      uoms: previous.uoms.filter((row) => row.key !== key),
    }));
  };

  const updateUomUnit = (key: string, value: UnitOfMeasure | "") => {
    setFormData((previous) => ({
      ...previous,
      uoms: previous.uoms.map((row) =>
        row.key === key ? { ...row, uom: value } : row,
      ),
    }));
  };

  const updateUomText = (
    key: string,
    field: "conversion_factor" | "cost_price" | "retail_price" | "wholesale_price",
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      uoms: previous.uoms.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    }));
  };

  // Keep only one default UoM per purpose: checking a row clears the flag on the others.
  const handleUomFlag = (
    key: string,
    flag: "is_default_purchase" | "is_default_sales",
    checked: boolean,
  ) => {
    setFormData((previous) => ({
      ...previous,
      uoms: previous.uoms.map((row) => ({
        ...row,
        [flag]: row.key === key ? checked : checked ? false : row[flag],
      })),
    }));
  };

  const validateUoms = (): ProductUomPayload[] | null => {
    const seen = new Set<string>();
    const payload: ProductUomPayload[] = [];

    for (const row of formData.uoms) {
      if (!row.uom) {
        setError("Each alternate UoM requires a unit of measure.");
        return null;
      }
      if (row.uom === formData.base_uom) {
        setError("An alternate UoM cannot match the Base UoM.");
        return null;
      }
      if (seen.has(row.uom)) {
        setError(`Duplicate alternate UoM: ${row.uom}.`);
        return null;
      }
      seen.add(row.uom);

      const factor = Number(row.conversion_factor);
      if (!Number.isFinite(factor) || factor <= 0) {
        setError(`Conversion factor for ${row.uom} must be greater than 0.`);
        return null;
      }

      for (const [label, raw] of [
        ["Cost", row.cost_price],
        ["Retail", row.retail_price],
        ["Wholesale", row.wholesale_price],
      ] as const) {
        const parsed = toNumberOrNull(raw);
        if (raw.trim() !== "" && (parsed === null || parsed < 0)) {
          setError(`${label} price override for ${row.uom} must be 0 or greater.`);
          return null;
        }
      }

      payload.push({
        uom: row.uom as UnitOfMeasure,
        conversion_factor: factor,
        ...(toNumberOrNull(row.cost_price) !== null
          ? { cost_price: toNumberOrNull(row.cost_price)! }
          : {}),
        ...(toNumberOrNull(row.retail_price) !== null
          ? { retail_price: toNumberOrNull(row.retail_price)! }
          : {}),
        ...(toNumberOrNull(row.wholesale_price) !== null
          ? { wholesale_price: toNumberOrNull(row.wholesale_price)! }
          : {}),
        is_default_purchase: row.is_default_purchase,
        is_default_sales: row.is_default_sales,
      });
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    const category = Number(formData.categoryId);

    if (!Number.isInteger(category) || category < 1) {
      setError("Please select a valid category.");
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

    const costPrice = Number(formData.cost_price);

    if (!Number.isNaN(costPrice) && costPrice < 0) {
      setError("Cost price must be 0 or greater.");
      return;
    }

    const wholesalePrice = toNumberOrNull(formData.wholesale_price);
    if (formData.wholesale_price.trim() !== "" && wholesalePrice === null) {
      setError("Wholesale price must be 0 or greater.");
      return;
    }
    if (wholesalePrice !== null && wholesalePrice < 0) {
      setError("Wholesale price must be 0 or greater.");
      return;
    }

    const binId = toNumberOrNull(formData.binId);
    if (formData.binId.trim() !== "" && (binId === null || !Number.isInteger(binId) || binId < 1)) {
      setError("Please select a valid bin location.");
      return;
    }

    const uoms = validateUoms();
    if (uoms === null) return;

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

        cost_price: Number.isNaN(costPrice) ? 0 : costPrice,

        retail_price: retailPrice,

        uoms,

        allowDuplicate: formData.allowDuplicate,
      };

      if (isEdit) {
        // PATCH replaces the whole alternate-UoM set; null clears optional fields.
        payload.wholesale_price = wholesalePrice;
        payload.binId = binId;

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
      } else {
        payload.current_quantity = baseQuantity;
        payload.wholesale_price = wholesalePrice ?? undefined;
        payload.binId = binId ?? undefined;
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
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { details?: { code?: string } } } })
        ?.response;

      if (response?.data?.details?.code === "PRODUCT_HAS_TRANSACTION_HISTORY") {
        setError(
          "Base UOM cannot be changed after stock history exists. Revert the Base UOM or adjust stock instead.",
        );
        setFormData((previous) => ({
          ...previous,
          base_uom: product?.base_uom ?? previous.base_uom,
          confirmUomChange: false,
        }));
      } else {
        setError(getErrorMessage(err, "Failed to save product."));
      }
    } finally {
      setLoading(false);
    }
  };

  const uomSelectClass =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm";

  const baseCost = Number(formData.cost_price);
  const baseRetail = Number(formData.retail_price);
  const baseWholesale = toNumberOrNull(formData.wholesale_price);

  const baseCostNum = Number.isFinite(baseCost) ? baseCost : 0;
  const baseRetailNum = Number.isFinite(baseRetail) ? baseRetail : null;
  const baseWholesaleNum = baseWholesale !== null && baseWholesale >= 0 ? baseWholesale : null;

  if (isEdit && !editDetail) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading product...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {detailError && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <div className="flex items-center justify-between gap-3">
            <span>
              {detailError} Showing list data, which may be outdated.
            </span>
            <Button type="button" variant="outline" size="sm" onClick={retryDetail}>
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
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
          <Label htmlFor="categoryId">Category *</Label>
          <select
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className={uomSelectClass}
            required
          >
            <option value="" disabled>
              {categoriesLoading
                ? "Loading categories..."
                : categories.length === 0
                  ? "No categories available"
                  : "Select a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesError && (
            <p className="text-xs text-destructive">{categoriesError}</p>
          )}
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

      <div className="rounded-lg border p-3">
        <h3 className="mb-1 font-semibold">Inventory</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Stock quantity and reorder point are always configured in the Base
          UoM ({formData.base_uom}).
        </p>

        <div className="grid gap-3 md:grid-cols-3">
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
              className={uomSelectClass}
            >
              {PRODUCT_UOMS.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_quantity">Initial Quantity</Label>
            <Input
              id="current_quantity"
              type="number"
              min="0"
              className="font-mono"
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
              className="font-mono"
              value={formData.reorder_point_ROP}
              onChange={(e) => updateField("reorder_point_ROP", e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="binId">Bin Location</Label>
            <BinLocationSelect
              id="binId"
              value={formData.binId}
              selectedLabel={binLabel}
              onChange={(binId, label) => {
                updateField("binId", binId);
                setBinLabel(label);
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <h3 className="mb-1 font-semibold">Base UoM Pricing</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Cost, retail, and wholesale prices are per single Base UoM unit.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cost_price">Cost Price</Label>
            <Input
              id="cost_price"
              type="number"
              min="0"
              step="0.01"
              className="font-mono"
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
              className="font-mono"
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
              className="font-mono"
              value={formData.wholesale_price}
              onChange={(e) => updateField("wholesale_price", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Alternate UoMs</h3>
            <p className="text-xs text-muted-foreground">
              Optional package units (e.g. BOX, SACK). Leave price overrides
              blank to use the calculated base price × conversion factor.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addUomRow}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add UoM
          </Button>
        </div>

        {formData.uoms.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No alternate UoMs configured.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {formData.uoms.map((row) => {
              const usedUoms = new Set(
                formData.uoms
                  .filter((other) => other.key !== row.key && other.uom)
                  .map((other) => other.uom),
              );
              const factor = Number(row.conversion_factor);
              const effectiveCost = effectiveUomPrice(
                row.cost_price,
                baseCostNum,
                factor,
              );
              const effectiveRetail = effectiveUomPrice(
                row.retail_price,
                baseRetailNum,
                factor,
              );
              const effectiveWholesale = effectiveUomPrice(
                row.wholesale_price,
                baseWholesaleNum,
                factor,
              );

              return (
                <div key={row.key} className="relative rounded-md border p-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-7 w-7"
                    onClick={() => removeUomRow(row.key)}
                    title="Remove UoM"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <div className="grid gap-2 pr-8 md:grid-cols-5">
                    <div className="space-y-1">
                      <Label>UoM</Label>
                      <select
                        value={row.uom}
                        onChange={(e) =>
                          updateUomUnit(row.key, e.target.value as UnitOfMeasure | "")
                        }
                        className={uomSelectClass}
                      >
                        <option value="">Select UoM</option>
                        {PRODUCT_UOMS.filter(
                          (uom) =>
                            uom === row.uom ||
                            (uom !== formData.base_uom && !usedUoms.has(uom)),
                        ).map((uom) => (
                          <option key={uom} value={uom}>
                            {uom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label>Factor</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        className="font-mono"
                        placeholder="e.g. 100"
                        value={row.conversion_factor}
                        onChange={(e) =>
                          updateUomText(row.key, "conversion_factor", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Cost override</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="font-mono"
                        value={row.cost_price}
                        onChange={(e) =>
                          updateUomText(row.key, "cost_price", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Retail override</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="font-mono"
                        value={row.retail_price}
                        onChange={(e) =>
                          updateUomText(row.key, "retail_price", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Wholesale override</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="font-mono"
                        value={row.wholesale_price}
                        onChange={(e) =>
                          updateUomText(row.key, "wholesale_price", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pr-8 text-xs">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.is_default_purchase}
                        onChange={(e) =>
                          handleUomFlag(
                            row.key,
                            "is_default_purchase",
                            e.target.checked,
                          )
                        }
                        className="h-3.5 w-3.5"
                      />
                      Default purchase
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.is_default_sales}
                        onChange={(e) =>
                          handleUomFlag(row.key, "is_default_sales", e.target.checked)
                        }
                        className="h-3.5 w-3.5"
                      />
                      Default sales
                    </label>
                    <span className="font-mono text-muted-foreground">
                      Effective: cost {formatEffective(effectiveCost)} · retail{" "}
                      {formatEffective(effectiveRetail)} · wholesale{" "}
                      {formatEffective(effectiveWholesale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2.5">
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
                stock recount. It is blocked if the product already has stock
                history.
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
