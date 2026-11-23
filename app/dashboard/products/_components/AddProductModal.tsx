"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products/types";

interface AddProductModalProps {
  onSaved?: (product?: Product) => void;
}

export function AddProductModal({}: AddProductModalProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      onClick={() => router.push("/dashboard/products/new")}
      className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
    >
      + Add Product
    </Button>
  );
}