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
import { StockMovement } from "@/lib/inventory/mock-adjustments"

interface StockMovementHistoryTableProps {
  movements: StockMovement[]
}

export function StockMovementHistoryTable({ movements }: StockMovementHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Product ID / Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Qty Changed</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Logged By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-xs text-muted-foreground font-medium">{log.date}</TableCell>
            <TableCell className="font-semibold">{log.productId}</TableCell>
            <TableCell>
              <Badge variant={log.adjustmentType === "STOCK_IN" ? "default" : "destructive"}>
                {log.adjustmentType === "STOCK_IN" ? "Stock In" : "Stock Out"}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-bold">
              {log.adjustmentType === "STOCK_IN" ? `+${log.quantity}` : `-${log.quantity}`}
            </TableCell>
            <TableCell>{log.reason}</TableCell>
            <TableCell>{log.staffId}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}