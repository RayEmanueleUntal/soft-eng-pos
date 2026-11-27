// Yes/No prompt after a PO line's conversion factor is edited away from the product record.
// Not a destructive dialog: Yes keeps the override, No restores the catalog default.
// Opened from CreatePurchaseOrderForm when the factor field is blurred or Create is pressed with an unconfirmed override.
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/shared/FormModal";

export interface FactorOverrideConfirm {
  productId: number;
  productName: string;
  uom: string;
  catalogFactor: number;
  overrideFactor: number;
}

interface FactorOverrideConfirmDialogProps {
  confirm: FactorOverrideConfirm | null;
  onYes: (productId: number) => void;
  onNo: (productId: number) => void;
}

// Asks whether to keep a typed conversion factor that differs from the product record.
export function FactorOverrideConfirmDialog({
  confirm,
  onYes,
  onNo,
}: FactorOverrideConfirmDialogProps) {
  const acceptedRef = React.useRef(false);

  React.useEffect(() => {
    if (confirm) acceptedRef.current = false;
  }, [confirm]);

  return (
    <FormModal
      open={confirm !== null}
      onOpenChange={(open) => {
        if (!open && confirm && !acceptedRef.current) onNo(confirm.productId);
      }}
      title="Use this conversion factor?"
      description={
        confirm ? (
          <>
            <span className="font-medium text-foreground">
              {confirm.productName}
            </span>
            {": "}
            <span className="font-mono text-foreground">
              {confirm.uom} ×{confirm.overrideFactor}
            </span>
            {" (product record is "}
            <span className="font-mono">×{confirm.catalogFactor}</span>
            ).
          </>
        ) : null
      }
      size="md"
      className="z-[70] sm:max-w-sm"
    >
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => confirm && onNo(confirm.productId)}
        >
          No
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (!confirm) return;
            acceptedRef.current = true;
            onYes(confirm.productId);
          }}
        >
          Yes
        </Button>
      </div>
    </FormModal>
  );
}
