import { ProductTable } from "@/components/products/ProductTable";

export default function ProductsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[24px] font-bold font-heading tracking-tight text-foreground">Products</h1>

        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your product catalog, pricing, inventory settings, and product
          details.
        </p>
      </div>

      <ProductTable />
    </div>
  );
}
