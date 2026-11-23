"use client";

import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/shared/DetailShell";
import { ProductForm } from "../_components/ProductForm";
import type { Product } from "@/lib/products/types";

export default function AddProductPage() {
  const router = useRouter();

  const handleSaved = (_product?: Product) => {
    router.push("/dashboard/products");
    router.refresh();
  };

  return (
    <DetailShell
      title="Add New Product"
      backLabel="Back to Products"
      backHref="/dashboard/products"
      maxWidth="4xl"
    >
      <div className="bg-card rounded-[4px] border border-input p-6 shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <ProductForm onSaved={handleSaved} />
      </div>
    </DetailShell>
  );
}