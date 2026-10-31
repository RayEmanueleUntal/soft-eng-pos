// Reorder point table for the Inventory Management module of the POS system.
// Lists items at or below their ROP (most urgent first) with search and role-gated row actions.
// Opens the Stock In, Stock Out and Edit ROP modals and asks the page to refetch after each save.
"use client"

import * as React from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, SearchIcon } from "lucide-react"
import { InventoryItem } from "@/lib/inventory/types"
import { getStockStatus } from "@/lib/inventory/stock-status"
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge"
import { StockMovementModal } from "@/components/inventory/StockMovementModal"
import { EditROPModal } from "@/components/inventory/EditROPModal"

interface ROPTableProps {
  ropItems: InventoryItem[]
  categories: Record<number, string>
  onRefresh: () => void
  canManageStock: boolean
  canEditROP: boolean
}

type RowAction = "in" | "out" | "rop"

interface ActiveAction {
  type: RowAction
  item: InventoryItem
}

// Renders the ROP list with search and manages whichever row-action modal is open.
export function ROPTable({
  ropItems,
  categories,
  onRefresh,
  canManageStock,
  canEditROP,
}: ROPTableProps) {
  const [search, setSearch] = React.useState("")
  const [active, setActive] = React.useState<ActiveAction | null>(null)

  const showActions = canManageStock || canEditROP
  const columnCount = showActions ? 10 : 9

  // Filter by name or SKU, then sort: largest deficit (most critical) first
  const term = search.trim().toLowerCase()
  const filteredItems = ropItems.filter(
    (item) =>
      !term ||
      item.name.toLowerCase().includes(term) ||
      (item.sku ?? "").toLowerCase().includes(term)
  )

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aDeficit = a.reorder_point_ROP - a.current_quantity
    const bDeficit = b.reorder_point_ROP - b.current_quantity
    return bDeficit - aDeficit
  })

  // Closes the open modal.
  const handleClose = () => setActive(null)

  return (
    <div className="space-y-4">
      {/* Header with count and search */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {ropItems.length} {ropItems.length === 1 ? "item" : "items"} at or below reorder point
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
          <Input
            placeholder="Search name or SKU..."
            className="pl-9 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Dimensions</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Thread Type</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Material</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider text-right">Current Qty</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider text-right">ROP</TableHead>
              <TableHead className="text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Status</TableHead>
              {showActions && (
                <TableHead className="w-[100px] text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#E0F2FE]/50 h-8">
                  <TableCell className="font-mono font-medium text-foreground">{item.sku || '-'}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>{categories[item.categoryId] ?? `Category #${item.categoryId}`}</TableCell>
                  <TableCell>{item.size_dimensions || '-'}</TableCell>
                  <TableCell>{item.thread_type || '-'}</TableCell>
                  <TableCell>{item.material_grade || '-'}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{item.current_quantity}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{item.reorder_point_ROP}</TableCell>
                  <TableCell><StockStatusBadge status={getStockStatus(item)} /></TableCell>
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
                              <DropdownMenuItem onClick={() => setActive({ type: "in", item })}>
                                Stock In
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActive({ type: "out", item })}>
                                Stock Out
                              </DropdownMenuItem>
                            </>
                          )}
                          {canEditROP && (
                            <DropdownMenuItem onClick={() => setActive({ type: "rop", item })}>
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
                  {ropItems.length === 0
                    ? "No items are at or below their reorder point."
                    : "No items match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>Showing {sortedItems.length} of {ropItems.length} entries</span>
      </div>

      {active && (active.type === "in" || active.type === "out") && (
        <StockMovementModal
          item={active.item}
          type={active.type}
          open
          onOpenChange={(open) => !open && handleClose()}
          onSuccess={onRefresh}
        />
      )}

      {active?.type === "rop" && (
        <EditROPModal
          item={active.item}
          open
          onOpenChange={(open) => !open && handleClose()}
          onSaved={onRefresh}
        />
      )}
    </div>
  )
}
