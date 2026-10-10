// Admin System Settings page of the POS dashboard.
// Lets Admin and Manager view and maintain store-wide key-value business rules.
// Composes the settings header and the settings table components.
"use client";

import { SystemSettingsHeader } from "@/components/admin/system-settings/SystemSettingsHeader";
import { SystemSettingsTable } from "@/components/admin/system-settings/SystemSettingsTable";

// Renders the System Settings page layout.
export default function SystemSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-background min-h-[calc(100vh-4rem)]">
      <SystemSettingsHeader />
      <SystemSettingsTable />
    </div>
  );
}
