#!/bin/bash
cat << 'INNER_EOF' > components/inventory/StockAdjustmentModal.tsx
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
import { apiClient } from "@/lib/api";
import { InventoryItem } from "@/lib/inventory/types";

interface StockAdjustmentModalProps {
  item?: InventoryItem;
  onSuccess?: (details: {
    productId: string;
    adjustmentType: string;
    quantity: number;
    reason: string;
    staffId: string;
  }) => void;
  trigger?: React.ReactElement;
}

export function StockAdjustmentModal({ item, onSuccess, trigger }: StockAdjustmentModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: item?.id ? String(item.id) : "",
    adjustmentType: "STOCK_IN",
    quantity: "",
    reason: "",
    staffId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const qty = parseInt(formData.quantity) || 0;
    const delta_qty = formData.adjustmentType === "STOCK_OUT" ? -qty : qty;

    try {
      await apiClient.post("/inventory/adjust", {
        inventory_id: formData.productId,
        delta_qty: delta_qty,
        reason_code: formData.reason,
        staff_id: formData.staffId,
      });

      if (onSuccess) {
        onSuccess({
          productId: formData.productId,
          adjustmentType: formData.adjustmentType,
          quantity: qty,
          reason: formData.reason,
          staffId: formData.staffId
        });
      }

      setFormData({
        productId: item?.id ? String(item.id) : "",
        adjustmentType: "STOCK_IN",
        quantity: "",
        reason: "",
        staffId: "",
      });
      setOpen(false);
    } catch (err) {
      console.error("Adjustment failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          trigger ? trigger : (
            <Button className="h-9 px-4 py-2 bg-primary text-primary-foreground shadow rounded-[4px] font-heading font-semibold hover:bg-primary/90">
              Adjust Stock
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px] rounded-[4px] border border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-foreground">
            {item ? `Adjust Stock: ${item.name}` : "Adjust Stock"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {!item && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productId" className="text-right text-sm font-medium text-foreground">
                Product ID
              </label>
              <Input
                id="productId"
                placeholder="e.g. 101"
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="col-span-3 rounded-[2px]"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="adjustmentType" className="text-right text-sm font-medium text-foreground">
              Type
            </label>
            <select
              id="adjustmentType"
              value={formData.adjustmentType}
              onChange={(e) =>
                setFormData({ ...formData, adjustmentType: e.target.value })
              }
              className="col-span-3 flex h-9 w-full rounded-[2px] border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <option value="STOCK_IN">STOCK IN (+)</option>
              <option value="STOCK_OUT">STOCK OUT (-)</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right text-sm font-medium text-foreground">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="col-span-3 rounded-[2px]"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="reason" className="text-right text-sm font-medium text-foreground">
              Reason
            </label>
            <Input
              id="reason"
              placeholder="e.g. Damaged, Discrepancy"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="col-span-3 rounded-[2px]"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="staffId" className="text-right text-sm font-medium text-foreground">
              Staff ID
            </label>
            <Input
              id="staffId"
              placeholder="e.g. EMP-101"
              value={formData.staffId}
              onChange={(e) =>
                setFormData({ ...formData, staffId: e.target.value })
              }
              className="col-span-3 rounded-[2px]"
              required
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading} className="rounded-[4px] font-heading">
              {loading ? "Saving..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
INNER_EOF
