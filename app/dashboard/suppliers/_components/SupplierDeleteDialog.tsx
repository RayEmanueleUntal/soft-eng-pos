"use client";

import React from "react";
import { FormModal } from "@/components/shared/FormModal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SupplierDeleteDialogProps {
  isOpen: boolean;
  supplierName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function SupplierDeleteDialog({
  isOpen,
  supplierName,
  onClose,
  onConfirm,
  isLoading = false,
}: SupplierDeleteDialogProps) {
  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
      title="Are you sure?"
      description={
        <>
          This action will remove or deactivate{" "}
          <span className="font-semibold text-foreground">
            {supplierName || "this supplier"}
          </span>
          . This action cannot be undone.
        </>
      }
      size="md"
    >
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isLoading}
          onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            await onConfirm();
          }}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Delete Supplier
        </Button>
      </div>
    </FormModal>
  );
}
