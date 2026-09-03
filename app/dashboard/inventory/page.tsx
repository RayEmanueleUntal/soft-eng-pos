"use client"

import * as React from 'react'
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar"
import { InventoryTable } from "@/components/inventory/InventoryTable"
import { mockInventory } from "@/lib/inventory/mock-inventory"

export default function InventoryPage() {
  const [size, setSize] = React.useState<string | null>(null)
  const [threadType, setThreadType] = React.useState<string | null>(null)
  const [material, setMaterial] = React.useState<string | null>(null)
  const [category, setCategory] = React.useState<string | null>(null)

  const filteredInventory = React.useMemo(() => {
    return mockInventory.filter((item) => {
      return (
        (!size || item.size === size) &&
        (!threadType || item.threadType === threadType) &&
        (!material || item.material === material) &&
        (!category || item.category === category)
      )
    })
  }, [size, threadType, material, category])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <InventoryFilterBar
        size={size}
        setSize={setSize}
        threadType={threadType}
        setThreadType={setThreadType}
        material={material}
        setMaterial={setMaterial}
        category={category}
        setCategory={setCategory}
      />
      <InventoryTable inventory={filteredInventory} />
    </div>
  )
}
