// Supplier detail strip for the Create Purchase Order form in the POS inventory module.
// Shows the picked supplier's contact, location and lead time loaded from GET /suppliers/{id}.
// Used only by CreatePurchaseOrderForm; flags inactive or missing suppliers before submit.
import { Supplier } from "@/lib/suppliers/suppliers";

export interface SupplierDetailResult {
  supplierId: string;
  supplier: Supplier | null;
  error: string | null;
}

interface SupplierInfoPanelProps {
  loading: boolean;
  result: SupplierDetailResult | null;
}

// Renders the loading, error, inactive-warning or detail state of the selected supplier.
export function SupplierInfoPanel({ loading, result }: SupplierInfoPanelProps) {
  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading supplier details...</p>;
  }
  if (!result) return null;

  if (result.error || !result.supplier) {
    return (
      <p className="break-words rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
        {result.error ?? "Supplier details are unavailable."}
      </p>
    );
  }

  const { supplier } = result;

  if (supplier.status === "INACTIVE") {
    return (
      <p className="break-words rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
        {supplier.companyName} is inactive and cannot receive new purchase orders.
      </p>
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs sm:grid-cols-2">
      <p className="truncate" title={supplier.address}>
        <span className="text-muted-foreground">Location: </span>
        {supplier.address || "—"}
      </p>
      <p className="truncate" title={supplier.contactPerson}>
        <span className="text-muted-foreground">Contact: </span>
        {supplier.contactPerson || "—"}
      </p>
      <p className="truncate font-mono" title={supplier.phone}>
        <span className="font-sans text-muted-foreground">Phone: </span>
        {supplier.phone || "—"}
      </p>
      <p className="font-mono">
        <span className="font-sans text-muted-foreground">Lead time: </span>
        {supplier.leadTimeDays} days
      </p>
    </div>
  );
}
