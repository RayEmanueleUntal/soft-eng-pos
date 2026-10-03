// Stock movement modal for the Inventory Management module of the POS system.
// Records stock received (POST /inventory/stock-in) or dispatched (POST /inventory/stock-out) for one item.
// Controlled by its parent via open/onOpenChange and reports the created movement on success.
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InventoryItem } from "@/lib/inventory/types"
import { stockIn, stockOut, StockInParams, StockOutParams, StockMovementResponse } from "@/lib/inventory/stock-movement-api"
import { allowsDecimals, roundQty } from "@/lib/inventory/uom"

interface StockMovementModalProps {
  item: InventoryItem | null
  type: "in" | "out"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (movement: StockMovementResponse) => void
}

// Renders the stock-in or stock-out dialog for the given item.
export function StockMovementModal({ item, type, open, onOpenChange, onSuccess }: StockMovementModalProps) {
  const [quantity, setQuantity] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isStockIn = type === "in"
  const decimals = item ? allowsDecimals(item.base_uom) : false
  const projectedQuantity = item ? roundQty(isStockIn ? item.current_quantity + (parseFloat(quantity) || 0) : item.current_quantity - (parseFloat(quantity) || 0)) : 0

  // Validates the quantity, then records the stock movement through the API.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!item) return

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity")
      return
    }

    // For stock-out, validate against current quantity
    if (!isStockIn && qty > item.current_quantity) {
      setError(`Cannot remove more than available stock (${item.current_quantity})`)
      return
    }

    setIsSubmitting(true)

    try {
      const baseParams = {
        productId: item.id,
        current_uom: item.base_uom,
        reason: reason || undefined,
      }

      let movement: StockMovementResponse

      if (isStockIn) {
        const params: StockInParams = {
          ...baseParams,
          added_qty: qty,
        }
        movement = await stockIn(params)
      } else {
        const params: StockOutParams = {
          ...baseParams,
          taken_qty: qty,
        }
        movement = await stockOut(params)
      }

      onSuccess(movement)
      onOpenChange(false)
      setQuantity("")
      setReason("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record stock movement")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Closes the dialog and clears the form.
  const handleCancel = () => {
    onOpenChange(false)
    setQuantity("")
    setReason("")
    setError("")
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isStockIn ? "Stock In" : "Stock Out"} - {item.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Product Information</Label>
            <div className="bg-muted/50 p-2.5 rounded-lg space-y-1">
              <p className="text-sm"><span className="font-medium">Name:</span> {item.name}</p>
              <p className="text-sm"><span className="font-medium">Current Quantity:</span> {item.current_quantity} {item.base_uom}</p>
              <p className="text-sm"><span className="font-medium">UOM:</span> {item.base_uom}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({isStockIn ? "to add" : "to remove"})</Label>
            <Input
              id="quantity"
              type="number"
              min={decimals ? "0" : "1"}
              step={decimals ? "any" : "1"}
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="font-mono"
            />
          </div>

          {quantity && (
            <div className="bg-muted/50 p-2.5 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Projected Quantity:</span>{" "}
                <span className={`font-mono ${projectedQuantity < 0 ? "text-destructive" : ""}`}>
                  {projectedQuantity} {item.base_uom}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Delivery arrived, Damaged items, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : isStockIn ? "Stock In" : "Stock Out"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
