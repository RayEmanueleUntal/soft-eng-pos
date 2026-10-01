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
import { StockStatusBadge } from "./StockStatusBadge";
import { BinAssignmentModal } from "./BinAssignmentModal";
import { StockMovementModal } from "./StockMovementModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { EditROPModal } from "./EditROPModal";

interface InventoryTableProps {
  inventory: InventoryItem[];
  categories: Record<number, string>;
  onRefresh: () => void;
  canManageStock: boolean;
  canEditROP: boolean;
}

type RowAction = "in" | "out" | "adjust" | "bin" | "rop";

interface ActiveAction {
  type: RowAction;
  item: InventoryItem;
}

// Renders the inventory list and manages whichever row-action modal is open.
export function InventoryTable({
  inventory,
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Thread Type</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="text-right">Current Qty</TableHead>
            <TableHead className="text-right">ROP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bin Location</TableHead>
            {showActions && <TableHead className="w-12">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {inventory.length > 0 ? (
            inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.sku ?? "-"}</TableCell>

                <TableCell>{item.name}</TableCell>

                <TableCell>
                  {categories[item.categoryId] ??
                    `Category #${item.categoryId}`}
                </TableCell>

                <TableCell>{item.thread_type ?? "-"}</TableCell>

                <TableCell>{item.material_grade ?? "-"}</TableCell>

                <TableCell>{item.size_dimensions ?? "-"}</TableCell>

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
                              onClick={() =>
                                setActive({ type: "adjust", item })
                              }
                            >
                              Adjust Stock
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
