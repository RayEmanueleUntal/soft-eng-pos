// Dialog shell for creating a purchase order in the POS inventory module.
// Mounts CreatePurchaseOrderForm only while open so each opening starts with a clean draft.
// Opened from the purchase orders page.
"use client";

import { FormModal } from "@/components/shared/FormModal";
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="text-lg font-bold tracking-tight">
          New Purchase Order
        </span>
      }
      description="Pick an active supplier, then add low-stock items or search products."
      size="xl"
      className="sm:max-w-4xl flex max-h-[90vh] flex-col rounded-md border border-border p-4"
    >
      <CreatePurchaseOrderForm
        onCancel={() => onOpenChange(false)}
        onCreated={onCreated}
      />
    </FormModal>
  );
}
