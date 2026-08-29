"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROPItem } from "@/lib/inventory/mock-rop";

interface EditROPModalProps {
  item: ROPItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (itemId: number, newROP: number) => void;
}

export function EditROPModal({ item, open, onOpenChange, onSave }: EditROPModalProps) {
  const [ropValue, setRopValue] = useState<string>(item?.reorder_point_ROP.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    const newROP = parseInt(ropValue, 10);
    
    if (isNaN(newROP) || newROP < 0) {
      alert("Please enter a valid positive number for the reorder point");
      return;
    }
    
    onSave(item.id, newROP);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={item?.id || "none"}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reorder Point</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Product Information</p>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <p className="text-sm"><span className="font-medium">Name:</span> {item.name}</p>
              <p className="text-sm"><span className="font-medium">Current Quantity:</span> {item.current_quantity}</p>
              <p className="text-sm"><span className="font-medium">Current ROP:</span> {item.reorder_point_ROP}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="rop" className="text-sm font-medium">
              New Reorder Point
            </label>
            <Input
              id="rop"
              type="number"
              min="0"
              step="1"
              placeholder="Enter new reorder point"
              value={ropValue}
              onChange={(e) => setRopValue(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Items with quantity at or below this value will be marked as LOW STOCK
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
