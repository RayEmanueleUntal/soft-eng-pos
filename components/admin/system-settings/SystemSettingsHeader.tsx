// Page header for the admin System Settings screen of the POS system.
// Shows the title and a short explanation of store-wide business rules.
// Rendered at the top of /dashboard/admin/system-settings.
"use client";

// Renders the System Settings title and subtitle.
export function SystemSettingsHeader() {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-4">
      <h1 className="text-[24px] font-heading font-bold tracking-tight text-foreground">
        System Settings
      </h1>
      <p className="text-xs font-sans text-muted-foreground">
        Manage store-wide business rules such as the return window, tax rate,
        and receipt text.
      </p>
    </div>
  );
}
