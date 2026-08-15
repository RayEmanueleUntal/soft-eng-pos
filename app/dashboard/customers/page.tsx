import { CustomerTable } from "@/components/ui/profiles/CustomerTable";

export default function CustomersPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your retail and wholesale client profiles.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <CustomerTable />
      </div>
    </div>
  );
}