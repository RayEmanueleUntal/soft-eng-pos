"use client"

import * as React from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { InventoryItem } from "@/lib/inventory/mock-inventory"
import { BinAssignmentModal } from "./BinAssignmentModal"

interface InventoryTableProps {
  inventory: InventoryItem[]
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    setIsModalOpen(false)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Thread Type</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Current Quantity</TableHead>
            <TableHead>Bin Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.length > 0 ? (
            inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.threadType}</TableCell>
                <TableCell>{item.material}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.currentQuantity}</TableCell>
                <TableCell>
                  {item.binLocation.aisle} - {item.binLocation.shelf}
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleOpenModal(item)}>
                    Assign Bin
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No inventory items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {isModalOpen && selectedItem && (
        <BinAssignmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          item={selectedItem}
        />
      )}
    </>
  )
}
