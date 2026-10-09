"use client";



import { StaffTable } from "@/components/staff/StaffTable";

import { StaffHeader } from "@/components/staff/StaffHeader";

export default function StaffPage() {
  

  

  return (
    <div className="flex-1 space-y-6 p-8">
      
      <StaffHeader />

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <StaffTable />
      </div>
    </div>
  );
}
