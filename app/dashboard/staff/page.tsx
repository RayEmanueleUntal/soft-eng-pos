"use client";

import { StaffTable } from "./_components/StaffTable";
import { PageHeader } from "@/components/ui/pageheader";

export default function StaffPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <PageHeader
        header="Staff Management"
        subheader="Manage employee profiles, assigned system roles, and account access status."
      />

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <StaffTable />
      </div>
    </div>
  );
}
