"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryItem } from "@/lib/inventory/types";
import { getStockStatus } from "@/lib/inventory/stock-status";
import { StockStatusBadge } from "../../../../components/inventory/StockStatusBadge";
import { BinAssignmentModal } from "./BinAssignmentModal";
import { StockMovementModal } from "../../../../components/inventory/StockMovementModal";
import { StockAdjustmentModal } from "../../../../components/inventory/StockAdjustmentModal";
import { EditROPModal } from "../../../../components/inventory/EditROPModal";
import { Pencil, SlidersHorizontal } from "lucide-react";
import { TagBadge } from "@/components/shared/TagBadge";

interface InventoryTableProps {
  inventory: InventoryItem[];
  categories: Record<number, string>;
  onRefresh: () => void;
  canManageStock: boolean;
  canEditROP: boolean;
}

const HEAD_CLASS =
  "text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold";

type RowAction = "in" | "out" | "adjust" | "bin" | "rop";

interface ActiveAction {
  type: RowAction;
  item: InventoryItem;
}

export function InventoryTable({
  inventory,
  categories,
  onRefresh,
  canManageStock,
  canEditROP,
}: InventoryTableProps) {
  const [active, setActive] = React.useState<ActiveAction | null>(null);

  const showActions = canManageStock || canEditROP;
  const columnCount = 6 + (canManageStock ? 1 : 0) + (showActions ? 1 : 0);

  const handleClose = () => setActive(null);

  const handleSaved = () => {
    onRefresh();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted border-b border-border">
            <TableHead className={HEAD_CLASS}>Product</TableHead>
            <TableHead className={HEAD_CLASS}>Specifications</TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>
              Current Qty
            </TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>ROP</TableHead>
            <TableHead className={HEAD_CLASS}>Status</TableHead>
            <TableHead className={HEAD_CLASS}>Bin Location</TableHead>
            {canManageStock && (
              <TableHead className={`${HEAD_CLASS} text-center w-28`}>
                Adjust Stock
              </TableHead>
            )}
            {showActions && (
              <TableHead className={`${HEAD_CLASS} text-center w-16`}>
                Edit
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {inventory.length > 0 ? (
            inventory.map((item) => {
              const stockStatus = getStockStatus(item);
              const isLowStock = stockStatus === "low-stock";

              return (
                <TableRow
                  key={item.id}
                  className="h-[36px] border-b border-border hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors"
                >
                  <TableCell className="align-top py-3 whitespace-normal">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground break-words">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {item.sku ?? "-"}
                      </span>
                    </div>

                    <TagBadge>
                      {item.category_name || categories[item.categoryId] || `Category #${item.categoryId}`}
                    </TagBadge>
                  </TableCell>

                  <TableCell className="align-top py-3 whitespace-normal">
                    <div className="space-y-0.5 text-xs break-words">
                      <div>
                        <span className="text-muted-foreground">Size:</span>{" "}
                        <span className="font-medium text-foreground">
                          {item.size_dimensions || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Thread:</span>{" "}
                        <span className="font-medium text-foreground">
                          {item.thread_type || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Material:</span>{" "}
                        <span className="font-medium text-foreground">
                          {item.material_grade || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-mono tabular-nums">
                    <span
                      className={`text-base font-bold tracking-tight ${
                        isLowStock ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {Number(item.current_quantity).toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell className="text-right font-mono tabular-nums">
                    <span className="text-base font-bold tracking-tight">
                      {Number(item.reorder_point_ROP).toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <StockStatusBadge status={stockStatus} />
                  </TableCell>

                  <TableCell>
                    <div className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      {item.bin_aisle_number || item.bin_shelf_location
                        ? `${item.bin_aisle_number ?? "-"} - ${
                            item.bin_shelf_location ?? "-"
                          }`
                        : "-"}
                    </div>
                  </TableCell>

                  {canManageStock && (
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="rounded-[4px] border-input hover:bg-muted"
                              aria-label={`Adjust stock for ${item.name}`}
                            />
                          }
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setActive({ type: "in", item })}
                          >
                            Stock In
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActive({ type: "out", item })}
                          >
                            Stock Out
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActive({ type: "adjust", item })}
                          >
                            Manual Adjustment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}

                  {showActions && (
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${item.name}`}
                            />
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          {canManageStock && (
                            <DropdownMenuItem
                              onClick={() => setActive({ type: "bin", item })}
                            >
                              Assign Bin
                            </DropdownMenuItem>
                          )}
                          {canEditROP && (
                            <DropdownMenuItem
                              onClick={() => setActive({ type: "rop", item })}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="py-6 text-center text-muted-foreground"
              >
                No inventory items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {active && (active.type === "in" || active.type === "out") && (
        <StockMovementModal
          item={active.item}
          type={active.type}
          open
          onOpenChange={(open) => !open && handleClose()}
          onSuccess={handleSaved}
        />
      )}

      {active?.type === "adjust" && (
        <StockAdjustmentModal
          item={active.item}
          open
          onOpenChange={(open) => !open && handleClose()}
          onSuccess={handleSaved}
        />
      )}

      {active?.type === "bin" && (
        <BinAssignmentModal
          isOpen
          onClose={handleClose}
          onSaved={handleSaved}
          item={active.item}
        />
      )}

      {active?.type === "rop" && (
        <EditROPModal
          item={active.item}
          open
          onOpenChange={(open) => !open && handleClose()}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}