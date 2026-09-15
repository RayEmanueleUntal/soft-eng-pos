"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import type { Product } from "@/lib/products/types";

interface DeleteProductDialogProps {
  product: Product | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!product) {
    return null;
  }

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");

      await apiClient.delete(`/products/${product.id}`, {
        params: {
          forceHardDelete: false,
        },
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
      });

      onClose();
      onDeleted();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Unable to delete this product.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(product)}
      onOpenChange={(open) => {
        if (!open && !loading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>

          <DialogDescription>
            Are you sure you want to permanently delete{" "}
            <strong>{product.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          This action cannot be undone. Products with existing transaction
          history cannot be deleted by the backend.
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
