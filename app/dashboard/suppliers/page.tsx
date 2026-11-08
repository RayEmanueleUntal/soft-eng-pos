import { PageHeader } from "@/components/ui/pageheader";
import { SupplierTable } from "./_components/SupplierTable";

export default function SuppliersPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage procurement contacts and delivery lead times.
        </p>
      </div> */}
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="Suppliers"
          subheader="Manage procurement contacts and delivery lead times."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <SupplierTable />
      </div>
    </div>
  );
}
