// Movement log table for the Stock Adjustments page of the POS inventory module.
// Shows each recorded movement with product, type, quantity change, before/after and reason.
// The backend has no movement-list endpoint, so rows come from this session's API responses.
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
import { StockMovementLogEntry } from "@/lib/inventory/types"

interface StockMovementHistoryTableProps {
  movements: StockMovementLogEntry[]
}

const HEAD_CLASS = "text-foreground font-semibold font-mono text-[11px] uppercase tracking-wider"

type BadgeVariant = "default" | "destructive" | "secondary" | "outline"

// Picks a badge style for a movement type.
function badgeVariant(type: StockMovementLogEntry["type"]): BadgeVariant {
  if (type === "IN") return "default"
  if (type === "OUT") return "destructive"
  if (type === "ADJUSTMENT") return "secondary"
  return "outline"
}

// Formats an ISO date as a short local date and time.
function formatDate(value: string): string {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Renders the movement log, newest first as supplied by the page.
export function StockMovementHistoryTable({ movements }: StockMovementHistoryTableProps) {
  return (
    <div className="bg-card rounded-[4px] border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
            <TableHead className={HEAD_CLASS}>Date</TableHead>
            <TableHead className={HEAD_CLASS}>Product</TableHead>
            <TableHead className={HEAD_CLASS}>Type</TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>Qty Changed</TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>Before / After</TableHead>
            <TableHead className={HEAD_CLASS}>Reason</TableHead>
            <TableHead className={HEAD_CLASS}>Staff ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-16 text-muted-foreground">
                No movements recorded in this session yet.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-muted-foreground">{formatDate(log.date)}</TableCell>
                <TableCell>
                  <span className="font-mono font-semibold text-foreground">{log.sku ?? "-"}</span>
                  <span className="ml-2 text-muted-foreground">{log.productName}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(log.type)}>{log.type}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-mono tabular-nums font-bold ${
                    log.quantityChanged >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {log.quantityChanged >= 0 ? `+${log.quantityChanged}` : log.quantityChanged} {log.uom}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {log.previousQuantity} → {log.newQuantity}
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
