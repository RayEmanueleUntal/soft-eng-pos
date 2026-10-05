"use client";



import { StaffTable } from "@/components/staff/StaffTable";

import { StaffHeader } from "@/components/staff/StaffHeader";

export default function StaffPage() {
  

  

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-background min-h-[calc(100vh-4rem)]">
      
      <StaffHeader />

      <StaffTable />

    </div>
  );
}
