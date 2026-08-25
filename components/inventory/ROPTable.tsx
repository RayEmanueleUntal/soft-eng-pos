"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PencilIcon, SearchIcon } from "lucide-react"
import { ROPItem } from "@/lib/inventory/mock-rop"

interface ROPTableProps {
  ropItems: ROPItem[]
  onEdit: (item: ROPItem) => void
}

export function ROPTable({ ropItems, onEdit }: ROPTableProps) {
  // Calculate counts for tabs
  const lowStockCount = ropItems.filter(item => item.current_quantity <= item.reorder_point_ROP).length
  const adequateStockCount = ropItems.filter(item => item.current_quantity > item.reorder_point_ROP).length

  // Sort items: below ROP first, sorted by severity (largest deficit first)
  const sortedItems = [...ropItems].sort((a, b) => {
    const aDeficit = a.reorder_point_ROP - a.current_quantity
    const bDeficit = b.reorder_point_ROP - b.current_quantity
    
    // Items below ROP (positive deficit) come first
    const aBelowRop = aDeficit > 0
    const bBelowRop = bDeficit > 0
    
    if (aBelowRop && !bBelowRop) return -1
    if (!aBelowRop && bBelowRop) return 1
    
    // Both below ROP: larger deficit first (more critical)
    if (aBelowRop && bBelowRop) return bDeficit - aDeficit
    
    // Both at/above ROP: maintain original order
    return 0
  })

  const getStatusBadge = (item: ROPItem) => {
    const isLowStock = item.current_quantity <= item.reorder_point_ROP
    
    if (isLowStock) {
      return (
        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30">
          LOW STOCK
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
        ADEQUATE STOCK
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with tabs and search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600">
            All ({ropItems.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-blue-50">
            Low Stock ({lowStockCount})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-blue-50">
            Adequate Stock ({adequateStockCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 hover:bg-blue-50">
              <TableHead className="text-gray-700 font-semibold">Name</TableHead>
              <TableHead className="text-gray-700 font-semibold">Category</TableHead>
              <TableHead className="text-gray-700 font-semibold">Dimensions</TableHead>
              <TableHead className="text-gray-700 font-semibold">Thread Type</TableHead>
              <TableHead className="text-gray-700 font-semibold">Material</TableHead>
              <TableHead className="text-gray-700 font-semibold">Current Qty</TableHead>
              <TableHead className="text-gray-700 font-semibold">ROP</TableHead>
              <TableHead className="text-gray-700 font-semibold">Status</TableHead>
              <TableHead className="w-[100px] text-gray-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-blue-50/50">
                <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                <TableCell>Category {item.categoryId}</TableCell>
                <TableCell>{item.size_dimensions}</TableCell>
                <TableCell>{item.thread_type}</TableCell>
                <TableCell>{item.material_grade}</TableCell>
                <TableCell>{item.current_quantity}</TableCell>
                <TableCell>{item.reorder_point_ROP}</TableCell>
                <TableCell>{getStatusBadge(item)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(item)}
                    className="hover:bg-blue-100"
                  >
                    <PencilIcon className="size-4 text-gray-600" />
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
