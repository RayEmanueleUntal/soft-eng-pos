// Colored badge for a shipment's tracking status (PENDING, DISPATCHED, DELIVERED).
// Shared by the shipment table, detail drawer and status update modal.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/inventory/shipment-utils";
import { TrackingStatus } from "@/lib/inventory/shipment-types";

const STATUS_STYLES: Record<TrackingStatus, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  DISPATCHED: "border-primary/30 bg-primary/10 text-primary",
  DELIVERED: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700",
};

interface ShipmentStatusBadgeProps {
  status: TrackingStatus;
  className?: string;
}

export function ShipmentStatusBadge({
  status,
  className,
}: ShipmentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("uppercase rounded-sm", STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}