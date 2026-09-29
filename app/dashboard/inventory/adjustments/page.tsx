"use client"

import { useState } from "react"
import { mockMovements, StockMovement } from "@/lib/inventory/mock-adjustments"
import { StockMovementHistoryTable } from "@/components/inventory/StockMovementHistoryTable"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"

export default function InventoryAdjustmentsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements)

  const handleAddAdjustment = (details: {
    productId: string;
    adjustmentType: string;
    quantity: number;
    reason: string;
    staffId: string;
  }) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: StockMovement = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      productId: details.productId,
      adjustmentType: details.adjustmentType as "STOCK_IN" | "STOCK_OUT",
      quantity: details.quantity,
      reason: details.reason,
      staffId: details.staffId,
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
