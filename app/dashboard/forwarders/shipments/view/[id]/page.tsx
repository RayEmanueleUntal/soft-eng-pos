"use client";

import { useParams } from "next/navigation";
import { ShipmentDetailView } from "./_components/ShipmentDetailView";

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const shipmentId = Number.isNaN(id) ? null : id;

  return <ShipmentDetailView shipmentId={shipmentId} />;
}
