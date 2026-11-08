// Admin System Settings page of the POS dashboard.
// Lets Admin and Manager view and maintain store-wide key-value business rules.
// Composes the settings header and the settings table components.
"use client";

import { SystemSettingsTable } from "@/app/dashboard/admin/system-settings/_components/SystemSettingsTable";
import { PageHeader } from "@/components/ui/pageheader";

// Renders the System Settings page layout.
export default function SystemSettingsPage() {
  return (
    <div className="mx-auto space-y-6 bg-background min-h-[calc(100vh-4rem)]">
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        {/* Header Bar */}
        <PageHeader
          header="System Settings"
          subheader="Manage store-wide business rules such as the return window, tax rate,
        and receipt text."
        />
      </div>
      <SystemSettingsTable />
    </div>
  );
}
