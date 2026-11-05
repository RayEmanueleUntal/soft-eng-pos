// Editable draft line-items table for the Create Purchase Order form in the POS inventory module.
// Lets staff set quantity and an optional unit cost per product and see an estimated total.
// Used only by CreatePurchaseOrderForm.
"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export interface DraftLine {
  productId: number;
  sku: string | null;
  name: string;
  baseUom: string;
  costPrice: number;
  quantity: string;
  unitCost: string;
}

// Builds a draft line from a product with a starting quantity.
export function createDraftLine(item: InventoryItem, quantity: number): DraftLine {
  return {
    productId: item.id,
    sku: item.sku,
    name: item.name,
    baseUom: item.base_uom,
    costPrice: Number(item.cost_price),
    quantity: String(quantity),
    unitCost: "",
  };
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

// Returns the estimated cost of a line using the typed cost or the product's cost price.
export function getLineEstimate(line: DraftLine): number {
  if (!isValidQuantity(line.quantity) || !isValidUnitCost(line.unitCost)) return 0;
  const unit = line.unitCost.trim() === "" ? line.costPrice : Number(line.unitCost);
  return Number(line.quantity) * unit;
}

interface PoLineItemsEditorProps {
  lines: DraftLine[];
  disabled: boolean;
  onQuantityChange: (productId: number, value: string) => void;
  onUnitCostChange: (productId: number, value: string) => void;
  onRemove: (productId: number) => void;
}

// Renders the draft lines with inputs, remove buttons and the estimated grand total.
export function PoLineItemsEditor({
  lines,
  disabled,
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
                  colSpan={6}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  No line items yet. Add items from the ROP list or search products.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const qtyInvalid = !isValidQuantity(line.quantity);
                const costInvalid = !isValidUnitCost(line.unitCost);
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
                        placeholder={String(line.costPrice)}
                        value={line.unitCost}
                        disabled={disabled}
                        aria-invalid={costInvalid}
                        onChange={(e) =>
                          onUnitCostChange(line.productId, e.target.value)
                        }
                        className="h-7 rounded-[4px] text-right font-mono text-xs tabular-nums"
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
