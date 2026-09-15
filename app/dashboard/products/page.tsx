import { ProductTable } from "@/components/products/ProductTable";

export default function ProductsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>

        <p className="text-sm text-muted-foreground">
          Manage your product catalog, pricing, inventory settings, and product
          details.
        </p>
      </div>

      <ProductTable />
    </div>
  );
}
