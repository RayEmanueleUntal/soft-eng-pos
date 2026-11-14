// Status badge for the Purchase Orders subpage of the POS inventory module.
// Maps each backend po_status to one mono, 2px-corner tag using design token colours.
// Used by the purchase orders table and the cancel dialog.
import { Badge } from "@/components/ui/badge";
import { POStatus } from "@/lib/inventory/purchase-order-types";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-primary/30 bg-primary/5 text-primary",
  PARTIALLY_FULFILLED: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  FULFILLED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
};

interface PurchaseOrderStatusBadgeProps {
  status: POStatus;
}

// Renders the badge style that matches the given purchase order status.
export function PurchaseOrderStatusBadge({
  status,
}: PurchaseOrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className={`uppercase ${STATUS_STYLES[status] ?? ""}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
