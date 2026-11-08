import { PageHeader } from "@/components/ui/pageheader";
import { ProductTable } from "./_components/ProductTable";

export default function ProductsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your product catalog, pricing, inventory settings, and product
          details.
        </p>
      </div> */}

      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="Products"
          subheader="Manage your product catalog, pricing, inventory settings, and product
          details."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <ProductTable />
      </div>
    </div>
  );
}
