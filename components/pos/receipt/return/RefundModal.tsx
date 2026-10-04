"use client";

import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Receipt, ReceiptItem, ItemCondition, RefundRequest, ReturnResponse } from "@/lib/pos";
import { processRefund } from "@/lib/pos";

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  onSuccess: (approvalRequestId: number) => void;
}

export function RefundModal({ open, onOpenChange, receipt, onSuccess }: RefundModalProps) {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = selectedItemIndex !== null ? receipt.items[selectedItemIndex] : null;
  const maxQuantity = selectedItem?.quantity ?? 1;

  const resetForm = () => {
    setSelectedItemIndex(null);
    setQuantity("1");
    setCondition(null);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 400) {
        return message || "Invalid request. Please check your inputs.";
      }
      if (status === 404) {
        return "Transaction or product not found.";
      }
      return message || "An error occurred. Please try again.";
    }
    return "An unexpected error occurred.";
  };

  const handleSubmit = async () => {
    if (selectedItemIndex === null || !selectedItem?.productId) {
      setError("Please select an item to return.");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (qty > maxQuantity) {
      setError(`Quantity cannot exceed original quantity (${maxQuantity}).`);
      return;
    }

    if (!condition) {
      setError("Please select a condition for the return.");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Please provide a reason (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: RefundRequest = {
        transactionId: receipt.transactionId,
        productId: selectedItem.productId,
        quantity: qty,
        condition,
        reason: reason.trim(),
      };

      const response: ReturnResponse = await processRefund(request);
      onSuccess(response.approvalRequestId);
      handleClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading text-center">Process Refund</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            Select an item and provide details for the refund request
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item-select" className="text-xs font-medium">
              Select Item to Return
            </Label>
            <Select
              value={selectedItemIndex !== null ? String(selectedItemIndex) : ""}
              onValueChange={(value) => {
                setSelectedItemIndex(Number(value));
                setQuantity("1");
              }}
            >
              <SelectTrigger id="item-select" className="rounded-[4px] text-xs h-8">
                <SelectValue placeholder="Choose an item from receipt" />
              </SelectTrigger>
              <SelectContent>
                {receipt.items.map((item, index) => (
                  <SelectItem key={index} value={String(index)} className="text-xs">
                    {item.product_name} (Qty: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-xs font-medium">
              Quantity to Return
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!selectedItem}
              className="rounded-[4px] text-xs h-8"
            />
            <p className="text-[10px] text-muted-foreground">
              Max: {maxQuantity}
            </p>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition" className="text-xs font-medium">
              Condition
            </Label>
            <Select
              value={condition || undefined}
              onValueChange={(value) => setCondition(value as ItemCondition)}
            >
              <SelectTrigger id="condition" className="rounded-[4px] text-xs h-8">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFECTIVE" className="text-xs">
                  Defective
                </SelectItem>
                <SelectItem value="CHANGE_OF_MIND" className="text-xs">
                  Change of Mind
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-medium">
              Reason for Return
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why the item is being returned..."
              className="rounded-[4px] text-xs min-h-[80px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {reason.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-[4px] text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
