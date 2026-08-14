import { SupplierTable } from "@/components/ui/profiles/SupplierTable";

export default function SuppliersPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage procurement contacts and delivery lead times.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <SupplierTable />
      </div>
    </div>
  );
}