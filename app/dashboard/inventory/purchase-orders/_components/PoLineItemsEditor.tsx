// Editable draft line-items table for the Create Purchase Order form in the POS inventory module.
// Lets staff pick a UoM, optionally override its conversion factor, set quantity and unit cost.
// Used only by CreatePurchaseOrderForm.
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryItem } from "@/lib/inventory/types";
import { formatPeso } from "@/lib/utils";

// One orderable unit of a product: its base UoM (factor 1) or an alternate UoM with its default cost.
export interface UomOption {
  uom: string;
  factor: number;
  costPrice: number;
}

export interface DraftLine {
  productId: number;
  sku: string | null;
  name: string;
  uomOptions: UomOption[];
  uom: string;
  quantity: string;
  unitCost: string;
  factorOverride: string;
  factorUnlocked: boolean;
  factorConfirmedValue: string;
}

// Builds a draft line from a product with a starting quantity, defaulting to the base UoM.
export function createDraftLine(item: InventoryItem, quantity: number): DraftLine {
  const alternates = (item.uoms ?? [])
    .filter((entry) => entry.uom !== item.base_uom)
    .map((entry) => ({
      uom: entry.uom as string,
      factor: Number(entry.conversion_factor),
      costPrice: Number(entry.cost_price ?? entry.calculated_cost_price),
    }));

  return {
    productId: item.id,
    sku: item.sku,
    name: item.name,
    uomOptions: [
      { uom: item.base_uom, factor: 1, costPrice: Number(item.cost_price) },
      ...alternates,
    ],
    uom: item.base_uom,
    quantity: String(quantity),
    unitCost: "",
    factorOverride: "",
    factorUnlocked: false,
    factorConfirmedValue: "",
  };
}

// Returns the UoM option currently selected on a line (falls back to the first option).
export function getSelectedUom(line: DraftLine): UomOption {
  return line.uomOptions.find((option) => option.uom === line.uom) ?? line.uomOptions[0];
}

// Returns the catalog conversion factor for the selected UoM (base UoM is 1).
export function getCatalogFactor(line: DraftLine): number {
  return getSelectedUom(line).factor;
}

// Returns the factor this line will use: a valid override, otherwise the catalog default.
export function getEffectiveFactor(line: DraftLine): number {
  if (line.factorOverride.trim() !== "" && isValidFactor(line.factorOverride)) {
    return Number(line.factorOverride);
  }
  return getCatalogFactor(line);
}

// Returns true when the override is empty (use catalog) or a whole number of at least 1.
export function isValidFactor(value: string): boolean {
  if (value.trim() === "") return true;
  return /^\d+$/.test(value.trim()) && Number(value) >= 1;
}

// Returns true when the typed factor differs from the catalog and has not been confirmed yet.
export function needsFactorConfirm(line: DraftLine): boolean {
  if (line.factorOverride.trim() === "" || !isValidFactor(line.factorOverride)) return false;
  if (Number(line.factorOverride) === getCatalogFactor(line)) return false;
  return line.factorOverride !== line.factorConfirmedValue;
}

// Returns true when the quantity is a whole number of at least 1.
export function isValidQuantity(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number(value) >= 1;
}

// Returns true when the optional unit cost is empty or a non-negative number.
export function isValidUnitCost(value: string): boolean {
  if (value.trim() === "") return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

// Returns the estimated cost of a line using the typed cost or the selected UoM's default cost.
export function getLineEstimate(line: DraftLine): number {
  if (!isValidQuantity(line.quantity) || !isValidUnitCost(line.unitCost)) return 0;
  const unit =
    line.unitCost.trim() === "" ? getSelectedUom(line).costPrice : Number(line.unitCost);
  return Number(line.quantity) * unit;
}

interface PoLineItemsEditorProps {
  lines: DraftLine[];
  disabled: boolean;
  onUomChange: (productId: number, uom: string) => void;
  onFactorUnlock: (productId: number) => void;
  onFactorOverrideChange: (productId: number, value: string) => void;
  onFactorBlur: (line: DraftLine) => void;
  onQuantityChange: (productId: number, value: string) => void;
  onUnitCostChange: (productId: number, value: string) => void;
  onRemove: (productId: number) => void;
}

// Renders the draft lines with inputs, remove buttons and the estimated grand total.
export function PoLineItemsEditor({
  lines,
  disabled,
  onUomChange,
  onFactorUnlock,
  onFactorOverrideChange,
  onFactorBlur,
  onQuantityChange,
  onUnitCostChange,
  onRemove,
}: PoLineItemsEditorProps) {
  const estimatedTotal = lines.reduce((sum, line) => sum + getLineEstimate(line), 0);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-44">UoM</TableHead>
              <TableHead className="w-28 text-right">Qty</TableHead>
              <TableHead className="w-32 text-right">Unit cost</TableHead>
              <TableHead className="text-right">Est. total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  No line items yet. Add items from the ROP list or search products.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const qtyInvalid = !isValidQuantity(line.quantity);
                const costInvalid = !isValidUnitCost(line.unitCost);
                const factorInvalid = !isValidFactor(line.factorOverride);
                const selectedUom = getSelectedUom(line);
                const catalogFactor = getCatalogFactor(line);
                const effectiveFactor = getEffectiveFactor(line);
                const factorOverridden =
                  line.factorOverride.trim() !== "" &&
                  isValidFactor(line.factorOverride) &&
                  Number(line.factorOverride) !== catalogFactor;
                return (
                  <TableRow key={line.productId}>
                    <TableCell className="font-mono text-muted-foreground">
                      {line.sku ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span className="block max-w-[240px] truncate" title={line.name}>
                        {line.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Select
                            value={line.uom}
                            disabled={disabled}
                            onValueChange={(value) => {
                              if (value) onUomChange(line.productId, value);
                            }}
                          >
                            <SelectTrigger
                              size="sm"
                              aria-label={`Unit of measure for ${line.name}`}
                              className="rounded-[4px] font-mono text-xs"
                            >
                              <SelectValue>
                                <span>{selectedUom.uom}</span>
                                <span className="text-muted-foreground">
                                  ×{effectiveFactor}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                              {line.uomOptions.map((option) => (
                                <SelectItem key={option.uom} value={option.uom}>
                                  <span className="font-mono">{option.uom}</span>
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    ×{option.factor}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!line.factorUnlocked && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              disabled={disabled}
                              aria-label={`Override conversion factor for ${line.name} (optional)`}
                              title="Override conversion factor (optional)"
                              onClick={() => onFactorUnlock(line.productId)}
                            >
                              <Pencil />
                            </Button>
                          )}
                        </div>
                        {line.factorUnlocked && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              inputMode="numeric"
                              aria-label={`Conversion factor for ${line.name}`}
                              placeholder={String(catalogFactor)}
                              value={line.factorOverride}
                              disabled={disabled}
                              aria-invalid={factorInvalid}
                              onChange={(e) =>
                                onFactorOverrideChange(line.productId, e.target.value)
                              }
                              onBlur={() => {
                                const snapshot = line;
                                window.setTimeout(() => onFactorBlur(snapshot), 0);
                              }}
                              className="h-7 w-16 rounded-[4px] text-right font-mono text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            {factorOverridden && (
                              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                overridden
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        aria-label={`Quantity for ${line.name}`}
                        value={line.quantity}
                        disabled={disabled}
                        aria-invalid={qtyInvalid}
                        onChange={(e) =>
                          onQuantityChange(line.productId, e.target.value)
                        }
                        className="h-7 rounded-[4px] text-right font-mono text-xs tabular-nums"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        aria-label={`Unit cost for ${line.name}`}
                        placeholder={String(selectedUom.costPrice)}
                        value={line.unitCost}
                        disabled={disabled}
                        aria-invalid={costInvalid}
                        onChange={(e) =>
                          onUnitCostChange(line.productId, e.target.value)
                        }
                        className="h-7 rounded-[4px] text-right font-mono text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatPeso(getLineEstimate(line))}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={disabled}
                        aria-label={`Remove ${line.name}`}
                        onClick={() => onRemove(line.productId)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2 text-xs">
        <span className="text-muted-foreground">Estimated total</span>
        <span className="font-mono font-bold tabular-nums text-primary">
          {formatPeso(estimatedTotal)}
        </span>
      </div>
    </div>
  );
}
