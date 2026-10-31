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

interface AddProductModalProps {
  onSaved?: () => void;
}

export function AddProductModal({ onSaved }: AddProductModalProps) {
  const [open, setOpen] = useState(false);

  const handleSaved = () => {
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Add Product</Button>} />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <ProductForm onSaved={handleSaved} />
      </DialogContent>
    </Dialog>
  );
}
