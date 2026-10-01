// Reorder Point page for the Inventory Management module of the POS system.
// Shows live items at or below their reorder point so staff can restock or adjust the ROP.
// Row actions depend on the signed-in role (stock managers restock, managers/secretaries edit ROP).
"use client"

import { ROPTable } from "@/components/inventory/ROPTable"
import { Button } from "@/components/ui/button"
import { canEditROP, canManageStock } from "@/lib/auth/permissions"
import { useCurrentRole } from "@/lib/auth/use-current-role"
import { useROPItems } from "@/lib/inventory/useROPItems"

// Renders the ROP alert list with loading, error and empty states.
export default function ROPPage() {
  const { ropItems, categories, loading, error, refetch } = useROPItems()
  const role = useCurrentRole()

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reorder Point Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage reorder points for inventory items</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading ROP data...
        </div>
      ) : (
        <ROPTable
          ropItems={ropItems}
          categories={categories}
          onRefresh={refetch}
          canManageStock={canManageStock(role)}
          canEditROP={canEditROP(role)}
        />
      )}
    </div>
  )
}
