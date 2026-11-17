// Inventory table for the Inventory Management module of the POS system.
// Lists items with SKU, ROP, stock status and bin, plus a per-row actions menu for authorised staff.
// Opens the stock movement, adjustment and bin modals and asks the page to refetch after each save.
"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
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

interface InventoryTableProps {
  inventory: InventoryItem[];
  totalRecords: number; 
  categories: Record<number, string>;
  onRefresh: () => void;
  canManageStock: boolean;
  canEditROP: boolean;
}

const HEAD_CLASS =
  "text-foreground font-semibold font-mono text-[11px] uppercase tracking-wider";

type RowAction = "in" | "out" | "adjust" | "bin" | "rop";

interface ActiveAction {
  type: RowAction;
  item: InventoryItem;
}

// Renders the inventory list and manages whichever row-action modal is open.
export function InventoryTable({
  inventory,
  totalRecords,
  categories,
  onRefresh,
  canManageStock,
  canEditROP,
}: InventoryTableProps) {
  const [active, setActive] = React.useState<ActiveAction | null>(null);

  const showActions = canManageStock || canEditROP;
  const columnCount = showActions ? 11 : 10;

  // Closes the open modal.
  const handleClose = () => setActive(null);

  // Asks the page to refetch after any modal saves successfully.
  const handleSaved = () => {
    onRefresh();
  };

  return (
    <>
      {/*info subheading*/}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Product Profile List
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {totalRecords}
        </span>
      </div>

      {/*actual table*/}
      <div className="overflow-hidden rounded-[4px] border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
              <TableHead className={HEAD_CLASS}>Product</TableHead>
              <TableHead className={HEAD_CLASS}>Specifications</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Current Qty
              </TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>ROP</TableHead>
              <TableHead className={HEAD_CLASS}>Status</TableHead>
              <TableHead className={HEAD_CLASS}>Bin Location</TableHead>
              {showActions && (
                <TableHead className={`${HEAD_CLASS} w-12`}>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <TableRow key={item.id}>

               

                  {/* unified name */}
                  <TableCell className="align-top py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {item.sku ?? "-"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        {item.category_name ||
                          categories[item.categoryId] ||
                          `Category #${item.categoryId}`}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="align-top py-3">
                    <div className="space-y-0.5 text-xs">
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
                    {item.current_quantity}
                  </TableCell>

                  <TableCell className="text-right font-mono tabular-nums">
                    {item.reorder_point_ROP}
                  </TableCell>

                  <TableCell>
                    <StockStatusBadge status={getStockStatus(item)} />
                  </TableCell>

                  <TableCell className="font-mono">
                    {item.bin_aisle_number || item.bin_shelf_location
                      ? `${item.bin_aisle_number ?? "-"} - ${
                          item.bin_shelf_location ?? "-"
                        }`
                      : "-"}
                  </TableCell>

                  {/* action */}
                  {showActions && (
                    <TableCell>
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
                          <MoreHorizontal />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          {canManageStock && (
                            <>
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
                                onClick={() => setActive({ type: "bin", item })}
                              >
                                Assign Bin
                              </DropdownMenuItem>
                            </>
                          )}
                          {canEditROP && (
                            <DropdownMenuItem
                              onClick={() => setActive({ type: "rop", item })}
                            >
                              Edit ROP
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}   
                </TableRow>
              ))
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
      </div>

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
