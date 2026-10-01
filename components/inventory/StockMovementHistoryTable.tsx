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

// NOTE: Keeping mockMovements here as no specific /inventory/movements endpoint was defined for this in API
export function StockMovementHistoryTable({ movements }: StockMovementHistoryTableProps) {
  return (
    <div className="bg-card rounded-[4px] border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty Changed</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Logged By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-16 text-muted-foreground">
                No movements recorded.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-muted-foreground">{log.date}</TableCell>
                <TableCell className="font-semibold text-foreground">{log.productId}</TableCell>
                <TableCell>
                  <Badge variant={log.adjustmentType === "STOCK_IN" ? "default" : "destructive"}>
                    {log.adjustmentType === "STOCK_IN" ? "IN (+)" : "OUT (-)"}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-mono font-bold ${log.adjustmentType === 'STOCK_IN' ? 'text-primary' : 'text-destructive'}`}>
                  {log.adjustmentType === "STOCK_IN" ? `+${log.quantity}` : `-${log.quantity}`}
                </TableCell>
                <TableCell className="text-muted-foreground">{log.reason}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{log.staffId}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
