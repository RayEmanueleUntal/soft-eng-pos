# Changelog

2026-08-29: Added lib/pos/receipt-types.ts with shared Receipt interfaces aligned to the backend Prisma schema for POS receipt UI.
2026-08-29: Added PrintableInvoice component with mock receipt data, PHP formatting helpers, and store config for thermal-style receipts.
2026-08-29: Added ReceiptModal with post-checkout summary, print handler, and print-only CSS for thermal receipt output.
2026-09-29: Replaced window.location.reload() in InventoryTable with an onRefresh prop wired to the inventory page refetch.
2026-09-29: Improved BinAssignmentModal with current/new bin display, stricter Bin ID validation, and clearer API error messages.
2026-09-29: Restyled InventoryTable and BinAssignmentModal to design.md (mono/right-aligned numbers, secondary button, slate modal border).
2026-10-01: Fixed inventory page crash by passing the useInventory refetch function to InventoryTable's onRefresh prop.
2026-10-01: Phase 1 inventory foundation: shared API error helper, adjustInventory (new_count), BinLocation types, /api/auth/me and role permission hook.
2026-10-01: Phase 2 inventory modals: adjust modal rebuilt for new_count, bin picker via /bin-location, small stock movement modal edits.
2026-10-01: Live-tested stock endpoints; fixed API error helper to read details.message and blocked 0 in adjust modal (backend rejects it).
2026-10-01: Phase 3: inventory table SKU/ROP/Status, row actions menu with role gating, status tabs, sidebar sub-links, sub-path permissions, useInventory fixes.
2026-10-01: Fixed stock-in/out 500s: login now saves the token for API calls, and the dev mock-role header is sent only when logged out.
2026-10-01: Phase 4: ROP page live with search, category names, polling, role-gated Stock In/Out and Edit ROP saved via PATCH /products/{id}.
2026-10-01: Phase 5: adjustments page drops mock rows, logs real API movements (session only) with type, before/after and staff; removed mock-adjustments.
2026-10-01: Phase 6: design pass - inventory table header/border per design.md, file headers and function comments added to remaining inventory files.
2026-10-01: Cleanup: fixed textarea empty-interface lint error and removed unused mock-inventory.ts (fix_trigger.sh already removed).
2026-10-09: Added lib/admin/system-settings.ts with types, CRUD helpers, and status-aware error messages for /system-settings.
2026-10-09: Added the /dashboard/admin/system-settings page shell and SystemSettingsHeader with title and business-rules subtitle.
2026-10-09: Added SystemSettingsTable listing key, value, description and readable update date, with loading, empty and error states.
2026-10-09: Added SettingFormDialog for creating (POST) and editing (PATCH) system settings, with Add/Edit buttons and success banners.
