import { CustomerTable } from "@/app/dashboard/customers/_components/CustomerTable";
import { PageHeader } from "@/components/ui/pageheader";

export default function CustomersPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>

        <p className="text-muted-foreground text-sm mt-1">
          Manage your retail and wholesale client profiles.
        </p>
      </div> */}
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="Customers"
          subheader="Manage your retail and wholesale client profiles."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <CustomerTable />
      </div>
    </div>
  );
}
