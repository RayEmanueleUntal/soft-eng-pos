"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockMovement } from "@/lib/inventory/mock-adjustments";

interface StockAdjustmentModalProps {
  onAddAdjustment?: (adjustment: StockMovement) => void;
}

export function StockAdjustmentModal({ onAddAdjustment }: StockAdjustmentModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    adjustmentType: "STOCK_IN",
    quantity: "",
    reason: "",
    staffId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate date cleanly on client interaction to prevent SSR hydration errors
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: StockMovement = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      productId: formData.productId,
      adjustmentType: formData.adjustmentType as "STOCK_IN" | "STOCK_OUT",
      quantity: parseInt(formData.quantity) || 0,
      reason: formData.reason,
      staffId: formData.staffId,
    };

    if (onAddAdjustment) {
      onAddAdjustment(newLog);
    }

    setFormData({
      productId: "",
      adjustmentType: "STOCK_IN",
      quantity: "",
      reason: "",
      staffId: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">
        Adjust Stock
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="productId" className="text-right text-sm font-medium">
              Product ID
            </label>
            <Input
              id="productId"
              placeholder="e.g. PROD-101"
              value={formData.productId}
              onChange={(e) =>
                setFormData({ ...formData, productId: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="adjustmentType" className="text-right text-sm font-medium">
              Type
            </label>
            <select
              id="adjustmentType"
              value={formData.adjustmentType}
              onChange={(e) =>
                setFormData({ ...formData, adjustmentType: e.target.value })
              }
              className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="STOCK_IN">STOCK_IN</option>
              <option value="STOCK_OUT">STOCK_OUT</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right text-sm font-medium">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="reason" className="text-right text-sm font-medium">
              Reason
            </label>
            <Input
              id="reason"
              placeholder="e.g. Damaged, Discrepancy"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="staffId" className="text-right text-sm font-medium">
              Staff ID
            </label>
            <Input
              id="staffId"
              placeholder="e.g. EMP-101"
              value={formData.staffId}
              onChange={(e) =>
                setFormData({ ...formData, staffId: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit">Adjust Stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}