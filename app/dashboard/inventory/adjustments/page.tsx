"use client"

import { useState } from "react"
import { mockMovements, StockMovement } from "@/lib/inventory/mock-adjustments"
import { StockMovementHistoryTable } from "@/components/inventory/StockMovementHistoryTable"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"

export default function InventoryAdjustmentsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements)

  const handleAddAdjustment = (newLog: StockMovement) => {
    setMovements((prev) => [newLog, ...prev])
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">
            Process manual stock-in/stock-out logs and track inventory history.
          </p>
        </div>
        <StockAdjustmentModal onAddAdjustment={handleAddAdjustment} />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <StockMovementHistoryTable movements={movements} />
      </div>
    </div>
  )
}