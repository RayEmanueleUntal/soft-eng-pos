"use client"

import { useState, useEffect } from "react"
import { InventoryItem } from "@/lib/inventory/types"
import { ROPTable } from "@/components/inventory/ROPTable"
import { EditROPModal } from "@/components/inventory/EditROPModal"
import { fetchROPItems } from "@/lib/inventory/stock-rop-api"

export default function ROPPage() {
  const [ropItems, setRopItems] = useState<InventoryItem[]>([])
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadROPItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchROPItems()
        setRopItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ROP data")
      } finally {
        setLoading(false)
      }
    }

    loadROPItems()
  }, [])

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleSave = async (itemId: number, newROP: number) => {
    // Update local state immediately for responsiveness
    setRopItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, reorder_point_ROP: newROP, updatedAt: new Date().toISOString() }
          : item
      )
    )
    
    // Note: This won't persist to backend until endpoint is implemented
    // TODO: Add backend endpoint for PATCH /inventory/:id/rop
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reorder Point Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage reorder points for inventory items</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading ROP data...
        </div>
      ) : (
        <>
          <ROPTable 
            ropItems={ropItems} 
            onEdit={handleEdit}
          />

          <EditROPModal
            item={editingItem}
            open={isModalOpen}
            onOpenChange={handleModalClose}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  )
}