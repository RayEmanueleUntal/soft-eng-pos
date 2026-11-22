// Yes/No prompt after a PO line's conversion factor is edited away from the product record.
// Not a destructive dialog: Yes keeps the override, No restores the catalog default.
// Opened from CreatePurchaseOrderForm when the factor field is blurred or Create is pressed with an unconfirmed override.
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog
      open={confirm !== null}
      onOpenChange={(open) => {
        if (!open && confirm && !acceptedRef.current) onNo(confirm.productId);
      }}
    >
      <DialogContent
        className="z-[70] rounded-md border border-border sm:max-w-sm"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Use this conversion factor?</DialogTitle>
          <DialogDescription>
            {confirm ? (
              <>
                <span className="font-medium text-foreground">{confirm.productName}</span>
                {": "}
                <span className="font-mono text-foreground">
                  {confirm.uom} ×{confirm.overrideFactor}
                </span>
                {" (product record is "}
                <span className="font-mono">×{confirm.catalogFactor}</span>
                ).
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:gap-0">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
