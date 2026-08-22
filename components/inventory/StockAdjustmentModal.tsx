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

export function StockAdjustmentModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    adjustmentType: "",
    quantity: "",
    reason: "",
    staffId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to adjust stock will connect here later
    console.log("Adjusted Stock:", formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Adjust Stock</Button>} /> 
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="productId" className="text-right">
                        Product ID
                    </label>
                    <Input
                        id="productId"
                        value={formData.productId}
                        onChange={(e) =>
                            setFormData({ ...formData, productId: e.target.value })
                        }
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="adjustmentType" className="text-right">
                        Adjustment Type
                    </label>
                    <Input
                        id="adjustmentType"
                        value={formData.adjustmentType}
                        onChange={(e) =>
                            setFormData({ ...formData, adjustmentType: e.target.value })
                        }
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="quantity" className="text-right">
                        Quantity
                    </label>
                    <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                            setFormData({ ...formData, quantity: e.target.value })
                        }
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="reason" className="text-right">
                        Reason
                    </label>
                    <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) =>
                            setFormData({ ...formData, reason: e.target.value })
                        }
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="staffId" className="text-right">
                        Staff ID
                    </label>
                    <Input
                        id="staffId"
                        value={formData.staffId}
                        onChange={(e) =>
                            setFormData({ ...formData, staffId: e.target.value })
                        }
                        className="col-span-3"
                    />
                </div>
                <DialogFooter className="mt-4">
                     <Button type="submit">Save Product</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
}