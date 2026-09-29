import { Badge } from "@/components/ui/badge"
import { StockStatusType } from "@/lib/inventory/stock-status"

interface StockStatusBadgeProps {
  status: StockStatusType
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  if (status === "low-stock") {
    return (
      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30 font-mono text-xs">
        LOW STOCK
      </Badge>
    )
  }
  
  return (
    <Badge className="bg-[#eff4ff] border-blue-200 text-blue-700 hover:bg-blue-100 font-mono text-xs">
      ADEQUATE STOCK
    </Badge>
  )
}