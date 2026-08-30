"use client"

import { useState } from "react"
import { mockROPData, ROPItem } from "@/lib/inventory/mock-rop"
import { ROPTable } from "@/components/inventory/ROPTable"
import { EditROPModal } from "@/components/inventory/EditROPModal"

export default function ROPPage() {
  const [ropItems, setRopItems] = useState<ROPItem[]>(mockROPData)
  const [editingItem, setEditingItem] = useState<ROPItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = (item: ROPItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleSave = (itemId: number, newROP: number) => {
    setRopItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, reorder_point_ROP: newROP, updatedAt: new Date() }
          : item
      )
    )
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reorder Point Management</h1>
      </div>

      <ROPTable ropItems={ropItems} onEdit={handleEdit} />

      <EditROPModal
        item={editingItem}
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onSave={handleSave}
      />
    </div>
  )
}