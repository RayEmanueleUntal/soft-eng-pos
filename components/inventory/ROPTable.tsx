"use client"

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
import { PencilIcon, SearchIcon } from "lucide-react"
import { InventoryItem } from "@/lib/inventory/types"
import { getStockStatus } from "@/lib/inventory/stock-status"
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge"

interface ROPTableProps {
  ropItems: InventoryItem[]
  onEdit: (item: InventoryItem) => void
}

export function ROPTable({ ropItems, onEdit }: ROPTableProps) {
  // Calculate counts for tabs
  const lowStockCount = ropItems.filter(item => getStockStatus(item) === "low-stock").length
  const adequateStockCount = ropItems.filter(item => getStockStatus(item) === "adequate-stock").length

  // Sort items: below ROP first, sorted by severity (largest deficit first)
  const sortedItems = [...ropItems].sort((a, b) => {
    const aDeficit = a.reorder_point_ROP - a.current_quantity
    const bDeficit = b.reorder_point_ROP - b.current_quantity
    
    // Items below ROP (positive deficit) come first
    const aBelowRop = aDeficit >= 0
    const bBelowRop = bDeficit >= 0
    
    if (aBelowRop && !bBelowRop) return -1
    if (!aBelowRop && bBelowRop) return 1
    
    // Both below ROP: larger deficit first (more critical)
    if (aBelowRop && bBelowRop) return bDeficit - aDeficit
    
    // Both above ROP: maintain original order
    return 0
  })



  return (
    <div className="space-y-4">
      {/* Header with tabs and search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-primary" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            All ({ropItems.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-[#eff4ff]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Low Stock ({lowStockCount})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-[#eff4ff]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Adequate Stock ({adequateStockCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64"
            />
          </div>
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
              <TableHead className="w-[100px] text-foreground font-semibold font-mono text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-[#E0F2FE]/50 h-8">
                <TableCell className="font-medium text-foreground">{item.sku || '-'}</TableCell>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell>Category {item.categoryId}</TableCell>
                <TableCell>{item.size_dimensions || '-'}</TableCell>
                <TableCell>{item.thread_type || '-'}</TableCell>
                <TableCell>{item.material_grade || '-'}</TableCell>
                <TableCell className="text-right font-mono">{item.current_quantity}</TableCell>
                <TableCell className="text-right font-mono">{item.reorder_point_ROP}</TableCell>
                <TableCell><StockStatusBadge status={getStockStatus(item)} /></TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(item)}
                    className="hover:bg-blue-100"
                    title="Edit ROP (local only)"
                  >
                    <PencilIcon className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-{ropItems.length} of {ropItems.length} entries</span>
      </div>
    </div>
  )
}
