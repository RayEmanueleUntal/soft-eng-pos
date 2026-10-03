// Stock Adjustments page of the Inventory Management module of the POS system.
// Lets stock managers correct a product's counted quantity and shows this session's movement log.
// The log is session-only because the backend has no endpoint that lists stock movements.
"use client"

import { useState } from "react"
import { StockMovementHistoryTable } from "@/components/inventory/StockMovementHistoryTable"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"
import { InventoryItem, MovementType, StockMovementLogEntry } from "@/lib/inventory/types"
import { StockMovementResponse } from "@/lib/inventory/stock-movement-api"

// Renders the page header, the adjust button and the session movement log.
export default function InventoryAdjustmentsPage() {
  const [movements, setMovements] = useState<StockMovementLogEntry[]>([])

  // Adds a movement returned by the API to the top of the session log.
  const handleAddAdjustment = (
    movement: StockMovementResponse,
    item: InventoryItem,
  ) => {
    const entry: StockMovementLogEntry = {
      id: movement.id,
      date: new Date(movement.date).toISOString(),
      sku: item.sku,
      productName: item.name,
      type: movement.type as MovementType,
      uom: movement.current_uom,
      quantityChanged: movement.quantity_changed,
      previousQuantity: movement.previous_quantity,
      newQuantity: movement.new_quantity,
      reason: movement.reason,
      staffId: movement.staffId,
    }

    setMovements((prev) => [entry, ...prev])
  }

  return (
    <div className="flex flex-col h-full bg-background min-h-[calc(100vh-4rem)] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-[4px] border border-border shadow-sm">
        <div>
          <h1 className="text-[24px] font-bold font-heading tracking-tight text-foreground">Stock Adjustments</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Correct a product&apos;s stock to a newly counted quantity.
          </p>
        </div>
        <StockAdjustmentModal onSuccess={handleAddAdjustment} />
      </div>

      <div className="rounded-[4px] border border-border bg-card shadow-sm overflow-hidden flex-1 p-4">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-heading font-semibold text-foreground">Movements This Session</h2>
          <p className="font-mono text-xs text-muted-foreground">
            Session only: the server has no movement-history endpoint yet, so earlier movements are not listed.
          </p>
        </div>
        <StockMovementHistoryTable movements={movements} />
      </div>
    </div>
  )
}
