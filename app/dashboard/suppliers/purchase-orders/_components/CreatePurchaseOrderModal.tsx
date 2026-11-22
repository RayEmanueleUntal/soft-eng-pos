// Dialog shell for creating a purchase order in the POS inventory module.
// Mounts CreatePurchaseOrderForm only while open so each opening starts with a clean draft.
// Opened from the purchase orders page.
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PurchaseOrderDto } from "@/lib/inventory/purchase-order-types";
import { CreatePurchaseOrderForm } from "./CreatePurchaseOrderForm";

interface CreatePurchaseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (order: PurchaseOrderDto) => void;
}

// Renders the create-PO dialog around the form.
export function CreatePurchaseOrderModal({
  open,
  onOpenChange,
  onCreated,
}: CreatePurchaseOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col rounded-md border border-border p-4 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            New Purchase Order
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pick an active supplier, then add low-stock items or search products.
          </DialogDescription>
        </DialogHeader>
        <CreatePurchaseOrderForm
          onCancel={() => onOpenChange(false)}
          onCreated={onCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
