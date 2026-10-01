"use client"

import { useState } from "react"
import { mockMovements, StockMovement } from "@/lib/inventory/mock-adjustments"
import { StockMovementHistoryTable } from "@/components/inventory/StockMovementHistoryTable"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"
import { InventoryItem } from "@/lib/inventory/types"
import { StockMovementResponse } from "@/lib/inventory/stock-movement-api"

export default function InventoryAdjustmentsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements)

  const handleAddAdjustment = (
    movement: StockMovementResponse,
    item: InventoryItem,
  ) => {
    const when = new Date(movement.date);
    const formattedDate = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')} ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: StockMovement = {
      id: `MOV-${movement.id}`,
      date: formattedDate,
      productId: `${item.sku ?? item.id} (${item.name})`,
      adjustmentType: movement.quantity_changed >= 0 ? "STOCK_IN" : "STOCK_OUT",
      quantity: Math.abs(movement.quantity_changed),
      reason: movement.reason,
      staffId: String(movement.staffId),
    };
    
    setMovements((prev) => [newLog, ...prev])
  }

  return (
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-[4px] border border-border shadow-sm">
        <div>
          <h1 className="text-[24px] font-bold font-heading tracking-tight text-foreground">Stock Adjustments</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Process manual stock-in/stock-out logs and track inventory history.
          </p>
        </div>
        <StockAdjustmentModal onSuccess={handleAddAdjustment} />
      </div>

      <div className="rounded-[4px] border border-border bg-card shadow-sm overflow-hidden flex-1 p-4">
        <h2 className="text-[16px] font-heading font-semibold mb-4 text-foreground">Recent Movements</h2>
        <StockMovementHistoryTable movements={movements} />
      </div>
    </div>
  )
}
