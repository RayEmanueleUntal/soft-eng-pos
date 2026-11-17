// Stock status badge for the Inventory Management module of the POS system.
// Shows LOW STOCK or ADEQUATE STOCK as a small mono tag with 2px corners.
// Used by the inventory and ROP tables.
import { Badge } from "@/components/ui/badge"
import { StockStatusType } from "@/lib/inventory/stock-status"

interface StockStatusBadgeProps {
  status: StockStatusType
}

// Renders the badge style that matches the given stock status.
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  if (status === "low-stock") {
    return (
          <Badge className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 font-mono text-xs">
            LOW STOCK
          </Badge>
        )
      }
      
      return (
        <Badge className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-mono text-xs">
          ADEQUATE STOCK
        </Badge>
      )
}