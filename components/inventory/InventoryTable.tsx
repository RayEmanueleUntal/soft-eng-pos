"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/lib/inventory/types";
import { BinAssignmentModal } from "./BinAssignmentModal";

interface InventoryTableProps {
  inventory: InventoryItem[];
  categories: Record<number, string>;
}

export function InventoryTable({ inventory, categories }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      handleCloseModal();

      window.location.reload();
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

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

                <TableCell>
                  {categories[item.categoryId] ??
                    `Category #${item.categoryId}`}
                </TableCell>

                <TableCell>{item.thread_type ?? "-"}</TableCell>

                <TableCell>{item.material_grade ?? "-"}</TableCell>

                <TableCell>{item.size_dimensions ?? "-"}</TableCell>

                <TableCell>{item.current_quantity}</TableCell>

                <TableCell>
                  {item.bin_aisle_number || item.bin_shelf_location
                    ? `${item.bin_aisle_number ?? "-"} - ${
                        item.bin_shelf_location ?? "-"
                      }`
                    : "-"}
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
          onSaved={handleSave}
          item={selectedItem}
        />
      )}
    </>
  );
}
