"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./ProductForm";
import type { Product } from "@/lib/products/types";

interface AddProductModalProps {
  onSaved?: (product?: Product) => void;
}

export function AddProductModal({ onSaved }: AddProductModalProps) {
  const [open, setOpen] = useState(false);

  const handleSaved = (product?: Product) => {
    setOpen(false);
    onSaved?.(product);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm">
            + Add Product
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <ProductForm onSaved={handleSaved} />
      </DialogContent>
    </Dialog>
  );
}