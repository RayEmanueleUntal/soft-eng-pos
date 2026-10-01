# Changelog

2026-08-29: Added lib/pos/receipt-types.ts with shared Receipt interfaces aligned to the backend Prisma schema for POS receipt UI.
2026-08-29: Added PrintableInvoice component with mock receipt data, PHP formatting helpers, and store config for thermal-style receipts.
2026-08-29: Added ReceiptModal with post-checkout summary, print handler, and print-only CSS for thermal receipt output.
2026-09-29: Replaced window.location.reload() in InventoryTable with an onRefresh prop wired to the inventory page refetch.
2026-09-29: Improved BinAssignmentModal with current/new bin display, stricter Bin ID validation, and clearer API error messages.
2026-09-29: Restyled InventoryTable and BinAssignmentModal to design.md (mono/right-aligned numbers, secondary button, slate modal border).
