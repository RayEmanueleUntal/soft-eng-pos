"use client";

import { Suspense } from "react";
import { ShipmentsPageContent } from "./_components/ShipmentsPageContent";

export default function ShipmentsPage() {
  return (
    <Suspense fallback={null}>
      <ShipmentsPageContent />
    </Suspense>
  );
}
