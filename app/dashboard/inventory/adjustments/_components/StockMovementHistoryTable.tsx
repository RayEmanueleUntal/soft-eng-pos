// Movement log table for the Stock Adjustments page of the POS inventory module.
// Shows each recorded movement with product, type, quantity change, before/after, reason and resolved staff name.
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
import { StockMovementResponseDto } from "@/lib/inventory/types"

interface StockMovementHistoryTableProps {
  movements: StockMovementResponseDto[]
  staffMap?: Record<number, string>
  loading?: boolean
}

const HEAD_CLASS = "text-foreground font-semibold font-mono text-[11px] uppercase tracking-wider"

type BadgeVariant = "default" | "destructive" | "secondary" | "outline"

// Picks a badge style for a movement type.
function badgeVariant(type: StockMovementResponseDto["type"]): BadgeVariant {
  if (type === "IN") return "default"
  if (type === "OUT") return "destructive"
  if (type === "ADJUSTMENT") return "secondary"
  return "outline"
}

// Formats an ISO date as a short local date and time.
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

// Renders the movement log, newest first as supplied by the page.
export function StockMovementHistoryTable({
  movements,
  staffMap = {},
  loading = false,
}: StockMovementHistoryTableProps) {
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
            <TableHead className={HEAD_CLASS}>Staff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-20 text-muted-foreground text-xs">
                Loading stock movements...
              </TableCell>
            </TableRow>
          ) : movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-16 text-muted-foreground text-xs">
                No stock movements found.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((log) => {
              const productName = log.product?.name ?? `Product #${log.productId}`
              const productSku = log.product?.sku ?? null

              // Staff name resolution priority:
              // 1. Staff map (from /staff-users/{id})
              // 2. Nested staff object (first/last or username)
              // 3. Fallback Staff #ID
              let staffDisplayName = staffMap[log.staffId]
              if (!staffDisplayName && log.staff) {
                const first = log.staff.first_name || log.staff.firstName || ""
                const last = log.staff.last_name || log.staff.lastName || ""
                const full = `${first} ${last}`.trim()
                staffDisplayName = full || log.staff.username || `Staff #${log.staffId}`
              }
              if (!staffDisplayName) {
                staffDisplayName = `Staff #${log.staffId}`
              }

              return (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDate(log.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-foreground">{productName}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {productSku ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={badgeVariant(log.type)} className="text-[10px] font-mono">
                        {log.type}
                      </Badge>
                      {log.isOverride && (
                        <span className="text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/20 px-1 py-0.5 rounded-[2px] font-bold">
                          Override
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono tabular-nums text-xs font-bold ${
                      log.quantity_changed >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {log.quantity_changed >= 0 ? `+${log.quantity_changed}` : log.quantity_changed}{" "}
                    {log.current_uom}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
                    {log.previous_quantity} → {log.new_quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate" title={log.reason}>
                    {log.reason || "-"}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {staffDisplayName}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
