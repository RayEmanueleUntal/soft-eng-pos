"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InventoryItem } from "@/lib/inventory/mock-inventory"

interface BinAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem
}

export function BinAssignmentModal({
  isOpen,
  onClose,
  item,
}: BinAssignmentModalProps) {
  const [aisle, setAisle] = React.useState(item.binLocation.aisle)
  const [shelf, setShelf] = React.useState(item.binLocation.shelf.toString())

  const handleSave = () => {
    // Here you would typically update the data source
    console.log("Saving new location:", {
      itemId: item.id,
      aisle,
      shelf: parseInt(shelf, 10),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Bin Location for {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="aisle">Aisle</label>
            <Input
              id="aisle"
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="shelf">Shelf</label>
            <Input
              id="shelf"
              type="number"
              value={shelf}
              onChange={(e) => setShelf(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
