# Bug & Findings Register

Whole-app audit: frontend `lib/*` + components vs. backend controllers/DTOs/services/schema, plus live API checks.

- **Frontend:** `C:\Users\Pat\Desktop\soft-eng-pos`
- **Backend:** `C:\Users\Pat\Desktop\soft-eng-pos-api` (`http://localhost:3001`)
- **Method:** 7 parallel module audits (frontend modules, backend services, Prisma schema/auth/remaining services, remaining frontend pages) + live endpoint verification (seeded admin) + browser/UI sweep (Playwright)
- **Date:** 2026 audit session

> **Data-volume caveat:** the dev database is small (~7 transactions, ~5 products, 4 staff, 6+ customers). `limit=N` truncation findings are **latent** — guaranteed by code, invisible until data exceeds the cap. Project targets 8,000+ SKUs (AGENT.md).

## ⚠️ Live-test data mutations (dev DB only)

| Mutation | Detail |
|---|---|
| Customers created | `BUGTEST Alpha` (id 8), `BUGTEST Probe Two DIFFERENT` — test artifacts from idempotency probe |
| Checkouts | 2 × CASH checkout of 500 PCS product #5 (₱600 each) — product #5 stock is now **1500** (correct serialized value would be 1000 — see BUG-014 proof) |
| Wholesale balance | Customer #6 (Vanguard): two ₱100 payments recorded (ledger −₱200) but balance only fell ₱100 (BUG-032 proof); then a ₱1.20 fully-cash sale added phantom +₱5 AR via CREDIT payment (BUG-016 proof). Balance now 79,905 vs credit_limit 80,000 |

## Browser UI test results (Playwright, headless Chromium)

### Round 1 — smoke + POS sale
- **Login:** real UI login (`admin123`) → `/dashboard/pos` — works; all API calls 200.
- **Route sweep (admin):** all 18 dashboard routes HTTP 200, **zero console errors, zero page errors, zero failed API calls**.
- **POS sale E2E:** add to cart → PaymentModal (Cash/GCash, quick-tender, Complete-Sale gating) → ₱600 tender on ₱550 sale → `INV-2026-0006` created, cart cleared, receipt rendered. BUG-011 confirmed visually.
- **Receipt detail** (`/pos/receipt/9`): shows "Cash tendered ₱600 / Change ₱50" correctly (persisted receipt endpoint flattens properly); Refund/Exchange buttons present.

### Round 2 — multi-role sweep, modals, mobile, perf
- **RBAC matrix (live, 4 roles × 18 routes):**
  - ADMIN & MANAGER: all routes accessible.
  - CASHIER: blocked from adjustments/deliveries/POs/staff/admin pages (redirect to `/dashboard/pos`) — correct. **`/dashboard/suppliers` loads but `GET /suppliers` → 403** (BUG-044 confirmed live). `/dashboard/inventory/rop` loads with **no API error** — BUG-001's `/products` fetch accidentally masks the `/inventory/rop` 403.
  - **STOCK_MANAGEMENT (`stock_alex`): `ERR_TOO_MANY_REDIRECTS` on every navigation — see BUG-113.**
- **Modal sweep:** 12/12 create dialogs open cleanly (products 14 fields, customers, suppliers, staff, forwarders, bins, deliveries, POs, shipments "Log Shipment", expenses, system-settings) + inventory row-actions menu (Stock In/Out/Adjust/Assign Bin/Edit ROP) → Stock In dialog opens. Zero pageerrors.
- **Mobile viewport (390×844):** all 17 routes render; only `/inventory/adjustments` overflows by 1px (scrollW=391) — cosmetic.
- **Search perf:** `GET /products?search=` ~16–40ms across terms at current 5-product scale — trivially fast now; BUG-021 (no trigram indexes) remains a scale risk at 8k SKUs.
- **Print:** `@media print` in globals.css + `PrintableInvoice` + `window.print()` wired on receipt page/modal and delivery view — statically verified.
- **Scripts:** `scripts/ui-smoke.mjs`, `ui-probe*.mjs`, `ui-flow.mjs`, `ui-sale*.mjs`, `ui-receipt.mjs`, `ui-roles.mjs`, `ui-modals*.mjs`, `ui-mobile.mjs`, `ui-inventory.mjs`, `ui-inv-actions.mjs` (Playwright devDependency added, uncommitted).

## Severity summary

| Severity | Count |
|---|---|
| High | 24 |
| Medium | ~47 |
| Low | ~52 |
| Informational | 5 |

Live-confirmed bugs are marked **[LIVE-CONFIRMED]**.

---

# HIGH SEVERITY

## BUG-001 — ROP page scans only the first page of products instead of using `/inventory/rop`
- **Location:** `lib/inventory/stock-rop-api.ts:10-23`
- `GET /products?limit=100` + client-side `current_quantity <= reorder_point_ROP` filter. Only first 100 products evaluated; backend `GET /inventory/rop` → `{items, totalAlerts}` exists and works (verified live).
- **Fix:** Call `/inventory/rop`.

## BUG-002 — POS catalog truncated to first 100 products
- **Location:** `lib/pos/services/pos-api.ts:139-163`
- Single `GET /products?limit=100`; client-side search/filter. ~7,900 of 8,000 SKUs unfindable/unbuyable; `ExchangeModal` picker affected too.

## BUG-003 — POS customer picker truncated to first 100 customers
- **Location:** `lib/pos/services/pos-api.ts:168-180`
- Wholesale customers past page 1 can't be attached to CREDIT checkouts. Live `GET /customers?limit=1` → `totalPages:6`.
- The customers *admin* table uses server-side pagination (`CustomerTable.tsx`), but the POS picker path is unchanged.

## BUG-004 — Transaction history truncated and fails silently
- **Location:** `lib/pos/services/pos-api.ts:490-545`
- `limit=100` once; `catch` returns `[]` → API failure looks like "no transactions".

## BUG-005 — Staff list truncated to first 100
- **Location:** `app/dashboard/staff/_components/StaffTable.tsx:92-96`

## BUG-006 — StaffTable error handling bypasses `getErrorMessage`; maps non-existent `password_hash`
- **Location:** `StaffTable.tsx:98-127`; `lib/staff/types.ts:17`
- Live `GET /staff-users?limit=1` item keys: `id, username, first_name, last_name, assigned_role, is_active` — no `password_hash`.

## BUG-007 — Duplicate `setError` calls in POS catalog hook
- **Location:** `lib/pos/hooks/use-pos-catalog.ts:23-24, 43-44`

## BUG-008 — Idempotency-Key is per-URL, not per-payload → stale cached responses on retry **[LIVE-CONFIRMED]**
- **Locations:** `lib/api.ts:47-58`; backend `src/common/interceptors/idempotency.interceptor.ts:34-51`
- **Live proof:** `POST /customers` twice with the same `Idempotency-Key` but different bodies → second request returned the **first** response (`BUGTEST Alpha` id 8 both times; Beta never created). Backend caches by key only for 24h.
- **Impact:** `POST /pos/checkout` (10s timeout) — committed-but-lost response → next checkout with a different cart returns the old receipt, clears the new cart. Same for customer/staff/supplier mutations.
- **Fix:** Key by body hash or fresh UUID per attempt.

## BUG-009 — Cross-tab / multi-register refresh-token race forces logout
- **Locations:** `lib/api.ts:109-161`; backend `auth.service.ts:81-98` (single-use rotated refresh tokens)
- Per-tab mutex only; two tabs fire `/auth/refresh` concurrently → loser 401s → `handleLogoutRedirect()` clears shared `localStorage` → both sessions dead.

## BUG-010 — Auth cookie never refreshed → daily forced re-login + stale role + half-logout **[contract-verified]**
- **Locations:** `proxy.ts:39-51`, `app/api/auth/session/route.ts:18-26`, `lib/api.ts:143-146`
- Proxy authorizes on httpOnly cookie (`maxAge:24h`); refresh flow updates only `localStorage`. After 24h all `/dashboard` routes bounce to login despite valid 7-day refresh token; `/api/auth/me` reads stale cookie role; logout clears localStorage but not cookie → half-logged-in state.

## BUG-011 — Checkout response payment shape mismatch → post-checkout receipt loses tender/change/GCash ref **[BROWSER-CONFIRMED]**
- **Location:** `lib/pos/services/pos-api.ts:403-444`; backend `checkout-transaction-response.dto.ts:100-105`
- **Browser proof:** Completed a ₱550 sale tendering ₱600 via Playwright. Backend response: `payments:[{payment_method:"CASH", amount_paid:550, details:{cash_tendered:"600", change_given:"50"}}]` (note: `details` values are **strings**). The post-checkout `ReceiptModal` showed only "Payment Cash Amount paid ₱550.00" — **no Cash tendered ₱600, no Change ₱50**.
- **Blast radius refined:** the persisted receipt page (`/dashboard/pos/receipt/9`, via `/transactions/receipt/:id` which flattens correctly) **does** show "Cash tendered ₱600.00 / Change ₱50.00" — only the immediate post-sale modal is affected.
- **Fix:** Map from `p.details` (with `Number()` coercion — values arrive as strings), or re-fetch the receipt endpoint after checkout.

## BUG-012 — Refund/exchange quantity in sold-UoM; backend expects BASE UoM
- **Locations:** `RefundModal.tsx:114-120`, `ExchangeModal.tsx:157-166`; backend `create-refund.dto.ts:27-33`, `returns.service.ts:93-96`
- Refund of 1 BOX (factor 100) computes ~1/100 correct amount; restock equally wrong. `maxQuantity` cap disagrees with backend units.

## BUG-013 — Overdue-status field names mismatch → warning never displays **[LIVE-CONFIRMED]**
- **Locations:** `pos-api.ts:274-292`; backend `customer-overdue-status-response.dto.ts`
- Frontend reads `isOverdue`/`overdue`; backend returns `{hasOverdue, overdueCount, totalOverdueAmount}`. Live response confirmed. `CreditPaymentForm` never warns; cashier hits surprise block at checkout.
- `CustomerPaymentModal.tsx` (customer mgmt settlement) uses the correct `hasOverdue` shape — only the POS `CreditPaymentForm` path remains broken.

## BUG-014 — Backend: stock decrement is read-modify-write → lost updates **[LIVE-CONFIRMED]**
- **Location:** `src/inventory/inventory.service.ts:278-333, 179-198, 99-147`
- **Live proof:** Two concurrent `POST /pos/checkout` × 500 PCS (stock 2000) → both 201, stock = **1500** not 1000. ₱1,200 revenue recorded; 500 units sold but never deducted. Same pattern in restock/adjust.
- **Fix:** Atomic `decrement`/`increment` or `SELECT … FOR UPDATE`.

## BUG-015 — Backend: delivery receiving trusts client quantities; no over-receipt cap; state read outside tx
- **Location:** `src/deliveries/deliveries.service.ts:48-73, 114-143, 182-297`
- `actual_base_quantity`/`uom_conversion_factor` accepted verbatim (can restock arbitrary qty); cumulative received never capped at `expected_base_quantity`; PO status + prior deliveries read before `prisma.$transaction` → concurrent deliveries both pass; WAC from stale product map.

## BUG-016 — Backend: POS credit — credit amount never reconciled; multiple CREDIT payments bypass checks **[LIVE-CONFIRMED]**
- **Location:** `src/pos/pos.service.ts:112-114, 128-145, 297-306, 351-375`
- **Live proof:** ₱1.20 sale paid `CASH 1.20 + CREDIT 5.00` → 201, `outstanding_balance` +₱5 despite sale fully covered by cash. AR inflated arbitrarily; `cash_tendered`/`change_given` trusted client-side; overpayment accepted with no change computation; only first CREDIT payment counted for limit/balance but all persisted.

## BUG-017 — Backend: refund/exchange handlers never validate quantity → over-refund/over-restock/negative balances
- **Location:** `src/returns/handlers/refund/refund-approval.handler.ts:49-85`, `exchange-approval.handler.ts:53-104`, `returns.service.ts:65-130`
- `findFirst` on `(transactionId, productId)` collapses duplicate lines; quantity never checked vs sold or cumulative prior returns; `remaining_credit_balance` decremented with no floor → negative; `TransactionStatus.REFUNDED`/`PARTIALLY_REFUNDED` never written → refunded sales still count as revenue.

## BUG-018 — Backend: logout is a no-op — refresh tokens never revoked **[code-verified end-to-end]**
- **Location:** `src/auth/auth.controller.ts:51-58`, `jwt.strategy.ts:33-47`, `auth.service.ts:101-106`
- `logout()` reads `req.user?.tokenId`, but `JwtStrategy.validate()` returns the DB user object which has **no `tokenId`** (only the refresh payload carries it). `cacheManager.del('refresh_token:{userId}:')` targets a key that never exists → `{success:true}` but the 7-day refresh token stays valid. Stolen tokens can't be revoked.

## BUG-019 — Backend: `x-mock-role` header bypasses all authentication when `NODE_ENV !== 'production'`
- **Location:** `src/auth/guards/jwt-auth.guard.ts:8-22`
- Any request with `x-mock-role: ADMIN` skips JWT and injects a mock user whenever `NODE_ENV` isn't literally `'production'` — same gate as Swagger (`main.ts:43`). If deployed without `NODE_ENV=production` (common PM2/Docker default), unauthenticated full-admin access. Secondary: mock user uses `userId` not `id` → `staffId: undefined` reaches Prisma.
- **Fix:** Gate behind explicit env flag, fail closed.

## BUG-020 — Backend: refresh token doubles as access token when `JWT_REFRESH_SECRET` unset
- **Location:** `src/auth/auth.service.ts:118-120`, `jwt-refresh.strategy.ts:13-15`, `jwt.strategy.ts:14-22`
- `refreshSecret = JWT_REFRESH_SECRET || JWT_SECRET`. If unset, refresh tokens sign with the access secret; the refresh payload passes `JwtStrategy.validate()` → a 7-day refresh token works as a bearer access token on every guarded route, defeating the 15-min access design.
- **Fix:** Mandate `JWT_REFRESH_SECRET` at boot or reject refresh tokens in the access strategy (e.g., check `tokenId` presence).

## BUG-021 — Backend: product search cannot meet <100ms rule — no trigram/full-text indexes
- **Location:** `prisma/schema.prisma:329-376`; query `products.service.ts:44-67`
- Search = AND of per-keyword OR `contains … insensitive` across name/sku/size/thread/material. Only `@@index([name])` btree — useless for `ILIKE '%kw%'`. No pg_trgm GIN or tsvector despite AGENT.md mandate. Every search = sequential scan.

## BUG-022 — Backend: idempotency interceptor is non-atomic and unscoped
- **Location:** `src/common/interceptors/idempotency.interceptor.ts:34-59`
- `get → check → set(IN_PROGRESS)` has no atomic NX — two concurrent same-key requests both execute the handler (double checkout/expense/approval). Cache key `idempotency:${key}` has **no user/route scope** → cross-endpoint/cross-user replay of cached bodies. `tap` doesn't await caching; crash leaves `IN_PROGRESS` → 409 for 24h.

## BUG-023 — Backend: approval double-approve race + self-approval + unscoped reads
- **Location:** `src/approval/approval.service.ts:55-90,92-124`, `approval.controller.ts`
- Check-then-act on `status===PENDING` under READ COMMITTED → concurrent approves both execute handler (double refund/restock). No `requestedById !== reviewerId` check → managers can approve own requests. `GET /approval` has no `@Roles` → any authenticated CASHIER enumerates all requests incl. payload JSON. `createRequest` payload `IsObject`-only; handlers trust client-supplied breakdown values.

---

# MEDIUM SEVERITY

## BUG-024 — Pending refund/exchange breakdown field names don't match backend payload
- `receipt/[id]/page.tsx:293-309` reads `creditDebtCancellation`/`cashPayout`/`totalRefund`; backend stores `{totalRefundAmount, creditDebtReduction, cashPayoutAmount, originalPayments}` → pending card always ₱0.00.

## BUG-025 — Backend error messages swallowed: components read `data.message`, backend sends `data.details.message` **[LIVE-CONFIRMED shape]**
- **Locations:** `SupplierTable.tsx:96,121,142`; `StaffTable.tsx:123-127,209-212`; `AddStaffModal.tsx:104-111`; `RefundModal.tsx:62-76`; `ExchangeModal.tsx` ~95; `bins/page.tsx:70`
- **Live proof:** error body keys are `{statusCode, timestamp, path, details}` — no top-level `message`. Every backend error in these components shows a generic string (e.g., duplicate-username 409 → "Failed to save staff member.").

## BUG-026 — Stock movement history filters apply only to current page of 20
- `adjustments/page.tsx:177-249` — client-side filter on one page; `GetStockMovementsDto` lacks search/size/thread/material/categoryId (sending → 400). `fetchMatchingProductIds` loops all `/products` (~80 requests at 8k SKUs) per filter change.

## BUG-027 — Receive Delivery blocks backend-accepted deliveries; mis-measures partial POs
- `ReceiveDeliveryModal.tsx:178,193-195,445-446` — caps at full `expected_base_quantity`, not remaining; over-shipments can't be recorded; partial-PO second deliveries can silently over-receive.

## BUG-028 — PO selector truncates at 50 POs, page 1 only
- `POSelectList.tsx:37-45`; `delivery-api.ts:66-86` — client-side filters FULFILLED/CANCELLED; backend `status` param unused.

## BUG-029 — `fetchReceivedBaseByProduct` truncates at 100 deliveries
- `purchase-order-api.ts:70-84` — PO with >100 deliveries → wrong received totals/badges.

## BUG-030 — `fetchEligibleTransactions` lists only 10 recent completed orders
- `shipment-api.ts:97-112` — older unshipped orders unreachable without guessing invoice/customer.

## BUG-031 — Supplier dropdown in PO form truncates at 100
- `CreatePurchaseOrderForm.tsx:67`

## BUG-032 — Supplier delete of PO-linked supplier: backend deactivates + 409; UI shows error, never reloads
- `SupplierTable.tsx:127-147`; backend `suppliers.service.ts:185-198` — row stays ACTIVE-looking until manual refresh.

## BUG-033 — Inactive suppliers can never be reactivated via UI
- `SupplierModal.tsx` has no status control; `status`→`is_active` mapping exists but unreachable.

## BUG-034 — Cashier editing WHOLESALE customer always 403s
- `AddCustomerModal.tsx:93-110` sends `type` unconditionally; backend treats wholesale-field PATCH as ADMIN/MANAGER/SECRETARY (compounded by BUG-051's generic 403 text).

## BUG-035 — Duplicate-contact 409 has no recovery path
- `AddCustomerModal.tsx:115-120`; backend `allowDuplicate` + structured `DUPLICATE_CUSTOMER_CONTACT` payload unused.

## BUG-036 — Backend: PO status allows arbitrary transitions
- `purchase-orders.service.ts:357-419` — `PENDING→FULFILLED` with zero deliveries, regressions, etc. No state machine.

## BUG-037 — Backend: credit-limit check TOCTOU on `outstanding_balance`
- `pos.service.ts:128-145` + `customers.service.ts:401-432` — concurrent credit checkouts both pass.

## BUG-038 — Backend: `collectWholesalePayment` lost-update race **[LIVE-CONFIRMED]**
- `customers.service.ts:461-570`
- **Live proof:** Two concurrent ₱100 payments vs ₱80,000 balance → both 201, balance fell only ₱100. Two `CustomerPayment` audit rows + FIFO settlements total ₱200 vs ₱100 balance change — ledger/balance diverge.

## BUG-039 — Backend: dashboard gross margin is 10× too small **[LIVE-CONFIRMED]**
- `analytics.service.ts:131-132` — `* 10` should be `* 100` (net margin line 136 correct). Live `dashboard-summary` → `gross_profit.margin_percentage: 4.18` vs expected ~41.8.

## BUG-040 — Backend: return window off-by-one (~8 days) + no defect-tag verification
- `returns.service.ts:27-63` — `floor(diffDays) <= 7` passes 7d23h; negative diffs pass; AGENT.md defect-tag requirement unimplemented.

## BUG-041 — Backend: exchange valuation ignores tier/UoM/discounts; price difference never settled
- `exchange-approval.handler.ts:77-115` — always retail price; `price_difference` stored but no payment/refund/AR adjustment → upgrade collects nothing, downgrade refunds nothing.

## BUG-042 — Backend: shipment state machine regressions + racy dup check + hard delete
- `shipments.service.ts:93-107,206-226,412-428` — `DISPATCHED→PENDING` allowed; same-status no-ops; dup check outside tx; `deleteShipment` hard-deletes audit trail.

## BUG-043 — Backend: `endDate` `lte` excludes entire end day **[LIVE-CONFIRMED]**
- `analytics.service.ts:66,178,387,523`; `transactions.service.ts:63-68`; `deliveries.service.ts:328-332`; `purchase-orders.service.ts:301-309`; `inventory.service.ts:497-503`; `expenses.service.ts`
- **Live proof:** `GET /transactions?startDate=2026-11-14&endDate=2026-11-14` → **0** results; same range with `T23:59:59.999Z` → **3**. Date-only endDate systematically drops the whole end day across every date-filtered endpoint.

## BUG-044 — Role/permission mismatches both directions
- `lib/auth/roles.ts` + `layout.tsx` vs backend `@Roles`:
  - UI shows, API 403s: `/dashboard/suppliers` (CASHIER), `/dashboard/inventory/rop` (CASHIER/SALES_CLERK), ungated forwarder/product/supplier/bin mutation buttons, Deliveries nav for CASHIER/SALES_CLERK.
  - API allows, UI blocks: POS+receipts for SALES_CLERK/SECRETARY/STOCK_MANAGEMENT; expenses for SECRETARY (backend allows on all expense endpoints); `/inventory/movements` view for SECRETARY.
  - `layout.tsx` nav children for Suppliers/Forwarders/Staff/Products/Deliveries/Shipments/ROP/Bins still have **no** `allowedRoles`; `roles.ts` still lacks entries for `/dashboard/suppliers`, `/dashboard/forwarders`, `/dashboard/inventory/bins`, `/dashboard/inventory/shipments` → all roles pass those routes while APIs 403. `lib/auth/permissions.ts` matches `shipments.controller.ts` `@Roles` exactly — extend this pattern to the other modules.
- **Fix:** Single source of truth mapping routes ↔ `@Roles`.

## BUG-045 — `fetchReceiptApi` never requests returns/exchanges; `already_returned_qty` never populated
- `pos-api.ts:573-578`; backend defaults `includeReturns/Exchanges`=false; `transactions.service.ts:100-102` never passes it. Receipt reconstructs from `/approval` only → misses other channels; return modals can't cap prior returns.

## BUG-046 — Adjustments date filters use UTC-midnight parsing
- `adjustments/page.tsx:190-195` — `new Date("YYYY-MM-DD")` = UTC midnight → PH end-date excludes everything after 08:00 local; inconsistent with expenses page's correct local-time handling. The same midnight `endDate` boundary bug also exists in `POSelectList.tsx` (delivery PO selector).

## BUG-047 — `formatDateToInput` uses `toISOString()` → off-by-one-day in PH mornings
- `CreditPaymentForm.tsx:37-39` — 00:00–08:00 PHT yields yesterday for due-date default/`min`.

## BUG-048 — Customer switch to walk-in/retail after WHOLESALE items → guaranteed 403
- `pos/page.tsx:169-176`, `PosCart.tsx`, `pos-api.ts:198-216` — no reprice/warning; `transaction_type:WHOLESALE` + non-wholesale customer → `ForbiddenException`.

## BUG-049 — Line discount not capped; frontend/backend total math diverges
- `use-pos-cart.ts:13-25,219-242`, `CartItemRow.tsx:102-112`; backend `pos.service.ts:274-295` — backend subtracts Σ discounts from order total, no cap → discount > line gross eats other lines / negative grand_total; displayed ≠ charged.
- The cart was rewritten — `calcLineSubtotal` now clamps `subtotal`/`line_discount` ≥ 0, but `line_discount` is still **not capped at line gross** → divergence persists for over-discounted lines.

## BUG-050 — UoM wholesale price priority differs from backend
- `use-pos-cart.ts:57-75`, `ProductCard.tsx:63-88`; backend `pos.service.ts:244-254` — UoM explicit `retail_price` (no wholesale) + product `wholesale_price` → frontend shows `wholesale×factor`, backend charges `uom.retail_price`.
- `resolveUomPrice` prefers backend `calculated_*` fields, but the priority order still doesn't match backend (`uom.retail_price` must outrank base-wholesale×factor for wholesale transactions).

## BUG-051 — `getErrorMessage` discards backend message on 403
- `lib/utils.ts:33-35` — hardcoded "Access denied" ignores `details.message` for all modules.

## BUG-052 — Silent error swallowing in POS fetchers
- `pos-api.ts`: `fetchTransactionsApi`→`[]`; overdue catch→false; categories `.catch(()=>({data:[]}))`→names degrade to "General"; receipt invoice-search fallback swallows.

## BUG-053 — Backend: inactive staff retain access until token expiry
- `jwt.strategy.ts:33-47` — `validate()` doesn't check `is_active`; deactivated users transact up to 15 min. Refresh correctly blocked.

## BUG-054 — Backend: refresh rotation is check-then-delete (non-atomic)
- `auth.service.ts:81-98` — concurrent `/auth/refresh` with same token both pass hash check → two valid pairs (replay window). No reuse-detection/family revocation.

## BUG-055 — Backend: hardcoded 7-day Redis TTL ignores `JWT_REFRESH_EXPIRATION`
- `auth.service.ts:125-128,144` — TTL mismatch → silent session loss if JWT expiry >7d.

## BUG-056 — Backend: expense hard-delete + unbounded pagination
- `expenses.service.ts:95-103,234-255` — `prisma.expense.delete` violates audit-immutability; `limit` unbounded (`limit=1000000` dumps table); `page=999999` huge skip; out-of-range page → 200 empty.

## BUG-057 — Backend: dead `RequestType` enum values; refund never updates transaction status
- `schema.prisma:616-622` — `OVERRIDE_DISCOUNT`/`STOCK_OUT_OVERRIDE`/`DELETE_TRANSACTION` have no handlers → `createRequest` 400s; `REFUNDED`/`PARTIALLY_REFUNDED` never set → refunded sales count as revenue (see BUG-017).

## BUG-058 — Backend: exception filter only catches `HttpException` → inconsistent error shape
- `http-exception.filter.ts:9` — Prisma errors (P2002/P2025), TypeErrors bypass → Nest default `{statusCode,message}` without `details` wrapper → 500 instead of 409; breaks client error parsing.

## BUG-059 — Backend: case-sensitive uniques vs case-insensitive lookups; `contact_number` has no unique constraint
- `schema.prisma` — `username`/`category.name`/`binLocation`/`supplier.name`/`forwarder.company_name` uniques are case-sensitive while services look up `mode:'insensitive'` → "Bolts"/"bolts" coexist, `findFirst` picks arbitrary. `Customer.contact_number` only indexed — DB-level duplicates possible (relies on service check).

## BUG-060 — Backend: system-settings delete can break runtime; no caching; loose boolean parsing
- `system-settings.service.ts:84-95` — ADMIN/MANAGER can `DELETE` operational keys (e.g., `RETURN_WINDOW_DAYS`) → consumers throw mid-transaction. `get*()` hits Postgres every call (hot path). `getBoolean` treats `'TRUE '`/`'yes'` as false.

## BUG-061 — Movement "Qty Changed" labels base units with transaction UoM
- `StockMovementHistoryTable.tsx:127-134`; backend stores base units — 2 BOX (factor 12) shows "+24 BOX".

## BUG-062 — Staff-name resolution 403s for SECRETARY/STOCK_MANAGEMENT
- `adjustments/page.tsx:270-292`; `GET /staff-users/:id` is ADMIN/MANAGER only → names permanently `Staff #id` for those roles.

## BUG-063 — Receipt page merges approval quantities in mixed UoM units
- `receipt/[id]/page.tsx:130-140` — base-UoM approval qty added onto sold-UoM display qty.

## BUG-064 — PO line editor rejects fractional qty/factors backend accepts
- `PoLineItemsEditor.tsx:93-108` — integers only; backend allows decimals and factors like 0.001 (G→KG).

## BUG-065 — Forwarders search fires per keystroke, no debounce/race guard
- `forwarders/page.tsx:31-74` + `ForwarderFilterBar.tsx:39` — stale out-of-order responses possible (contrast `ProductPicker` 300ms debounce).

## BUG-066 — Approval Requests page swallows load failures; uses `alert()`
- `approval-requests/page.tsx:65-79,131,152` — API failure renders "No approval requests found"; approve/reject failures via blocking `alert()`.

## BUG-067 — LoginForm half-authenticated state on session-cookie failure
- `LoginForm.tsx:42-60` — `localStorage` tokens written before `POST /api/auth/session`; cookie failure leaves tokens in localStorage (API works) while proxy bounces all `/dashboard` nav → split-brain auth, no cleanup.

## BUG-068 — Backend: analytics correctness — COGS snapshot, sale-vs-stockout, AR drift
- `analytics.service.ts` — line 605 uses current `cost_price` not `TransactionItem` snapshot; "last sale" counts manual stock-outs (`MovementType.OUT` covers both); AR buckets (CreditPayment rows) vs displayed balance (WholeSaleCustomer) diverge under BUG-038/BUG-017.

## BUG-069 — Backend: wholesale downgrade can orphan AR records
- `customers.service.ts:338-370` — profile deleted when balance=0 & no `CustomerPayment` rows, but refund-settled `CreditPayment` rows can exist → customer vanishes from AR analytics with UNPAID/OVERDUE credits remaining.

## BUG-070 — Backend: inactive-user timing side-channel + 403-for-bad-credentials
- `auth.service.ts:42,51` — bad credentials return 403 (should be 401); inactive check skips `argon.verify` → timing distinguishes inactive accounts. No per-account lockout (only global 100/min throttle).

---

# LOW SEVERITY

| ID | Location | Issue |
|---|---|---|
| BUG-071 | `shipments.service.ts:164-193` | Status update outside transaction; concurrent updates interleave |
| BUG-072 | `inventory.service.ts:445-460` | `getProductsBelowROP` flags zero/negative stock too — verify intended |
| BUG-073 | `deliveries.service.ts:233-235` | WAC float math + mid-calc `toFixed(2)` vs `Prisma.Decimal` |
| BUG-074 | `pos.service.ts:294` | `tax_total` hardcoded 0 — confirm tax out of scope |
| BUG-075 | `pos.service.ts:226-233` | Unconfigured `current_uom` silently uses factor=1 (late rollback via UOMMismatch) |
| BUG-076 | `customers.service.ts:78-89` | Duplicate contact check not transactional; DB has no unique constraint (see BUG-059) |
| BUG-077 | `returns.service.ts:99-114` | Cash refund payout not capped by non-credit tender actually paid (`originalPayments` unused) |
| BUG-078 | `ShipmentTable.tsx:140-142` + `shipments.service.ts:133-142` | "Dispatched" column shows creation timestamp; `dispatch_date` never set on create/update |
| BUG-079 | `SupplierTable.tsx:81-105` | Supplier search no debounce + no race guard |
| BUG-080 | `SupplierTable.tsx:127-147` | Delete on last page → empty page, no clamp |
| BUG-081 | `AddStaffModal.tsx:252-274` | "Account Status" toggle in create mode; `is_active` silently dropped |
| BUG-082 | `EditROPModal.tsx:40-43` | ROP integers only; backend allows 3-decimal |
| BUG-083 | `inventory/page.tsx:47-55` | Low-stock tabs filter current page only; counts misleading |
| BUG-084 | `BinAssignmentModal.tsx:80-107` | Bin picker page-1-only (20 bins); search mitigates |
| BUG-085 | `bins/page.tsx:79-87` | Page change can apply unsubmitted search text |
| BUG-086 | `use-pos-cart.ts:245-276` | `updateItemUom` never wired — can't change UoM in cart |
| BUG-087 | `pos-api.ts:60-65` | First non-base UoM picked as `pricing_uom`; `is_default_sales` ignored; extra UoMs unreachable. `BackendProductUom` (`pos-types.ts:47-57`) also missing `cost_price`, `calculated_cost_price`, `is_default_purchase`, `is_default_sales` the backend returns — cost-side data invisible to POS pricing |
| BUG-088 | `CreditPaymentForm.tsx` ~153 | Credit always full balance — no partial splits; `poNumber` collected but dropped. `submitCheckout` emits only `{date}` for CREDIT `details`; `po_number`/`credit_due_date` in `CheckoutPaymentEntry` silently discarded (backend `CreditDetailsDto` accepts only `date` anyway) |
| BUG-089 | `pos-api.ts:229-238` | Dummy fallback `product_id:1` if checkout with empty cart (unreachable but fragile) |
| BUG-090 | `pos-types.ts:10-19` | `UnitOfMeasure` missing `SACK`; `PaymentMethod` missing `CHECK`/`BANK_TRANSFER` (spec includes Bank Transfer) |
| BUG-091 | `approval-api.ts:22-25` | Unpaginated `/approval` fetch per receipt view |
| BUG-092 | `pos-api.ts:556-561` | Receipt invoice lookup uses default `limit=10` |
| BUG-093 | `AddCustomerModal.tsx:82-87,44-58` | `credit_limit` unbounded (Decimal(10,2) overflow) + `NaN` passes `<1` check; add-mode modal never resets state between opens |
| BUG-094 | `use-pos-catalog.ts` | Category failure → names silently "General" |
| BUG-095 | `pos/page.tsx:19-79` | `MOCK_SWAGGER_RECEIPT` 60-line dead mock |
| BUG-096 | `lib/api.ts:155-158` | Refresh failure rejects with refresh error, not original |
| BUG-097 | `LoginForm.tsx:17,60` | Open redirect via `?redirect=` (external URL not validated); proxy drops attempted path |
| BUG-098 | `use-current-role.ts:26-28` | Dev fallback grants ADMIN UI on `/api/auth/me` failure — masks gating gaps |
| BUG-099 | Currency formatting | `formatPeso` vs `` `₱${toFixed(2)}` `` (ungrouped, `₱NaN`) vs `toLocaleString` mixes |
| BUG-100 | `lib/api.ts:5` | Missing `NEXT_PUBLIC_API_BASE_URL` → relative URLs → confusing 404s |
| BUG-101 | `app/api/auth/session/route.ts`, `me/route.ts` | Session route stores any posted token unvalidated; cookie `secure` flag opt-in; `maxAge` hardcoded 24h; proxy/me decode JWT without verification (UI-gating only, real authz still Bearer) |
| BUG-102 | `forwarders/types.ts:2` | `Forwarder.id: string` but API returns `number` |
| BUG-103 | `forwarders/page.tsx:127-132` | Delete last item on page >1 → empty page, no step-back |
| BUG-104 | `EditROPModal.tsx:28` | State initialized once; stale if `item` prop changes without remount (currently safe via conditional mount — fragile contract) |
| BUG-105 | `StockMovementModal.tsx:184-186` | Stock-out check doesn't round converted qty — epsilon disagreement with preview |
| BUG-106 | `app/dashboard/admin/` | No index `page.tsx` → direct `/dashboard/admin` 404s |
| BUG-107 | `app/page.tsx`, `dashboard/page.tsx:43-174` | create-next-app boilerplate + ~130 lines commented-out dashboard UI |
| BUG-108 | Backend schema indexes | Missing FK indexes: `Payment.transactionId`, `Return.*`, `Exchange.*`, `CustomerPayment.staffId`, `StockMovement.staffId/approvedById`, `PurchaseOrder.staffId`, `Expense.staffId/payment_method`; **`ApprovalRequest` has zero indexes** (filters+sort → seq scan); `Transaction.status/type` unindexed; redundant indexes on Forwarder/Supplier/WholeSaleCustomer |
| BUG-109 | `schema.prisma` misc | `Shipment.tracking_number` not unique; `BinLocation` lacks zone field + no update/delete endpoints; `Payment`/`TransactionItem`/`CustomerPayment` cascade deletes would wipe audit data if ever triggered; `ExpenseResponseDto.amount` Decimal→number vs other endpoints possibly string — inconsistent numeric typing |
| BUG-110 | `main.ts:20-29` | CORS origins hardcoded to 4 LAN IPs — DHCP changes break frontend; consider env-driven list |
| BUG-111 | `approval.controller.ts:78-79` | `status`/`type` query params unvalidated → invalid enum → Prisma validation error → 500 (not 400) via BUG-058 |
| BUG-112 | `credit-status-task.service.ts` | Daily cron, no distributed lock, errors swallowed to logs; never re-evaluates OVERDUE→PAID (handled by payment flow — OK) |

## BUG-113 — Roles without POS access get infinite redirect loop — app unusable **[BROWSER-CONFIRMED]**
- **Severity:** High
- **Locations:** `app/dashboard/page.tsx:42` (unconditional `redirect("/dashboard/pos")`), `proxy.ts:58-59` + `lib/auth/roles.ts:25` (`/dashboard/pos` = ADMIN/MANAGER/CASHIER only)
- **What:** `/dashboard` always redirects to `/dashboard/pos`. For STOCK_MANAGEMENT, SECRETARY, and SALES_CLERK the proxy then bounces `/dashboard/pos` → `/dashboard` → `/dashboard/pos` → … `ERR_TOO_MANY_REDIRECTS`. **Live proof:** `stock_alex` login landed on `/dashboard`, then every route navigation redirect-looped.
- **Impact:** Three of six roles cannot use the application at all via normal navigation (direct URLs to permitted pages like `/dashboard/inventory` still work, but login lands in the loop).
- **Fix:** Make `/dashboard` role-aware (redirect to first permitted route per role) or remove the hard redirect.

## BUG-114 — ROP page's `/products` fetch accidentally masks the `/inventory/rop` 403 for CASHIER/SALES_CLERK
- **Severity:** Low (observation)
- BUG-001's client-side `/products?limit=100` call is role-allowed, so cashier sees a "working" ROP page (with wrong/incomplete data anyway) instead of the 403 the dedicated endpoint would return. Fixing BUG-001 will surface BUG-044's ROP role mismatch — fix both together.

---

# ADDITIONAL FINDINGS

BUG-115–121 continue the register numbering.

## BUG-115 — Products page has no role gating on create/edit/delete **[code-verified]**
- **Severity:** Medium
- `ProductTable.tsx` renders Add/Edit/Delete for all roles; backend `products.controller.ts` restricts POST/PATCH to ADMIN/MANAGER/SECRETARY and DELETE to ADMIN/MANAGER. CASHIER/SALES_CLERK see controls that always 403; SECRETARY can edit but not delete with no UI distinction. `roles.ts` grants `/dashboard/products` to all six roles. Companion to BUG-044 — apply the `permissions.ts` pattern.

## BUG-116 — `fetchActiveForwarders` truncates at 100 **[code-verified]**
- **Severity:** Medium (latent)
- `shipment-api.ts:89-94` — `GET /forwarders?is_active=true&limit=100` once; >100 active forwarders silently missing from the shipment modal's forwarder picker. Same latent class as BUG-030.

## BUG-117 — `next.config.ts` `allowedDevOrigins` hardcodes a single LAN IP
- **Severity:** Low (dev-only)
- `allowedDevOrigins: ["10.42.0.1"]` — breaks dev access from any other host/IP (other dev machines, Tauri devtools, different LAN). Also a leftover commented duplicate config block. Consider env-driven or omitting.

## BUG-118 — `ProductForm` silently coerces invalid `cost_price` to `0`
- **Severity:** Low
- Non-numeric input → `NaN` → sent as `0` instead of a validation error (backend `cost_price` optional). Same NaN-vs-undefined inconsistency between create (omits) and edit (sends `null`).

## BUG-119 — `ProductTable` duplicate `useEffect` resetting page
- **Severity:** Low (cosmetic)
- `ProductTable.tsx:93-99` — identical `setPage(1)` effect declared twice on the same deps. Harmless but sloppy.

## BUG-120 — `pos/page.tsx` hold-transaction `alert()` placeholders
- **Severity:** Low
- `alert("Hold function activated")` stubs remain for hold shortcuts — dead UI affordance presented to cashiers.

## BUG-121 — Modal state-init fragility in `SettingFormDialog` / `AddStaffModal`
- **Severity:** Low
- `useState` initialized once from props; currently safe only because parents key-remount (`key={formSession}`, `key={edit-${id}}`). Any future caller that doesn't will show stale values when switching records. Document or reset-on-open.

## BUG-122 — Bins page keeps stale `searchQuery` after exact lookup
- **Severity:** Low
- `bins/page.tsx` — after an exact-location lookup replaces results with one row, `searchQuery` retains old text; a subsequent page change refetches with the stale filter. `AddBinModal` also rendered ungated (backend POST requires ADMIN/MANAGER/SECRETARY → CASHIER/STOCK_MANAGEMENT 403 — part of BUG-044).

---

# INFORMATIONAL / OBSERVATIONS

## OBS-001 — Backend rejects unknown query params with 400 **[LIVE-CONFIRMED]**
`forbidNonWhitelisted` → `GET /products?bogus_param=1` → 400. Also: `POST` on `@Idempotent` endpoints **requires** `Idempotency-Key` header (400 "Header Idempotency-Key is required" — verified). Out-of-range pages → 200 + empty `data`.

## OBS-002 — Analytics AR endpoint has no date filters
Only `limit` accepted — AR tab point-in-time (documented in PR #61).

## OBS-003 — Backend dev startup required `npm install`
`csv-parse` declared but missing → `TS2307` on seeds. Use `npm ci` fresh.

## OBS-004 — No `GET /returns` endpoint
Only `POST /returns/refund` + `POST /returns/exchange`; receipt history reconstructed from `/approval` (fragile — BUG-045/063).

## OBS-005 — `/api/auth/session` + proxy trust unverified JWT claims for UI gating
Real API authz uses the Bearer token (unforgeable); cookie role only drives nav visibility. Latent footgun (BUG-101).

---

# VERIFIED CLEAN

| Area | Result |
|---|---|
| Checkout request body | All fields match `CheckoutDto`/`ItemDto`/`PaymentDto`/details DTOs |
| Refund/exchange request bodies | Match DTOs field-for-field (quantity unit bug = BUG-012) |
| Customer list + settlement | Params/envelope/payload verified live earlier (12/12 checks) |
| Staff/supplier create+update payloads | Match DTOs; enums identical; envelopes handled |
| Expenses page module | Full contract match incl. pagination, idempotency, date validation |
| System settings, approvals DTOs, analytics | Match; all 5 analytics endpoints live-verified 200 |
| Stock in/out/adjust, deliveries, POs, shipments, forwarders, bins API paths | Paths/methods/fields/envelopes match backend DTOs |
| `getErrorMessage` | Correct when used — bug is bypassing components (BUG-025) |
| Refresh queue within a tab | Serializes concurrent 401s correctly |
| Proxy matcher | Covers all dashboard routes; no redirect loops for permitted roles (BUG-113 is the exception for STOCK_MGMT/SECRETARY/SALES_CLERK) |
| `lib/auth/permissions.ts` | Shipment helpers match `shipments.controller.ts` `@Roles` exactly (create/update/delete) |
| `lib/inventory/shipment-utils.ts` + `shipment-types.ts` | Match `TrackingStatus` enum and `{items, meta}` envelope |
| `StockMovementModal` stock in/out payloads | Match `StockInDto`/`StockOutDto` field names (`productId`, `current_uom`, `added_qty`/`taken_qty`, `allowOverride`) |
| Expense API (`expense-api.ts`/`expense-types.ts`) | Filters, pagination shape, `Idempotency-Key` on `@Idempotent` DELETE all correct |
| `@Idempotent` DELETE callers | `deleteExpense`, `DeleteForwarderModal`, `DeleteProductDialog`, `deleteSystemSetting` all attach `Idempotency-Key` manually — no missing-key bug |
| Forwarder create/update payloads | Match `CreateForwarderDto`/`UpdateForwarderDto`; supplier camelCase↔snake_case mapping correct |
| `AddStaffModal` / `SettingFormDialog` payloads | Match backend DTOs; parents key-remount correctly |
| `includeShipments` query param | Exists in `GetTransactionsQueryDto` — not stripped by whitelist |
| Customer settlement modal over-tender | `CustomerPaymentModal` caps `amount_paid` at balance client-side and sends the capped amount — backend never sees the over-tender |
| Shipments page fetch logic | Debounced search + request-sequence race guard + empty-page step-back + role-gated actions |
| PO page + products page fetch logic | Server-side pagination + debounce + role-gated mutations via `permissions.ts` |
| `ProductForm` edit flow | Fetches full `GET /products/:id` UoM set, validates UoM rows, handles `PRODUCT_HAS_TRANSACTION_HISTORY` |
| Schema unique constraints | `username`, `sku`, `poItem`, `productUom`, `binLocation`, `category`, `supplier`, `forwarder` uniques all exist at DB level |
| RolesGuard | Reads `assigned_role` from DB-fetched user — role changes effective immediately |
| Auth basics | argon2 hashing, SHA-256 refresh hashes in Redis, uniform signin errors, global throttler |
| No `dangerouslySetInnerHTML` anywhere | XSS-safe rendering |
| No raw `fetch`/`axios` bypasses of `lib/api.ts` | Only same-origin `/api/auth/*` |

---

# SUGGESTED ISSUE GROUPING

1. **fix(pos): server-side catalog/customer search & pagination** — BUG-001–005, 028–031
2. **fix(checkout): payment/credit correctness** — BUG-008–011, 016, 034, 037, 042, 048, 049, 050, 088
3. **fix(returns): quantity units, validation & settlement** — BUG-012, 017, 024, 040, 041, 045, 063
4. **fix(auth): session consistency, revocation & mock-role** — BUG-009, 010, 018–020, 053–055, 067, 097, 101
5. **fix(inventory/backend): stock atomicity, delivery caps, PO state machine** — BUG-014, 015, 036, 042, 061, 062
6. **fix(backend): idempotency atomicity, approval races, error-shape consistency** — BUG-022, 023, 056–060, 070, 111
7. **fix(analytics): margin ×10, COGS snapshot, endDate bounds** — BUG-039, 043, 068
8. **fix(roles): reconcile frontend gating with backend @Roles** — BUG-044, 051, 081, **113 (redirect loop — ships first)**, 114, 115, 122
9. **perf(db): product search indexes (pg_trgm/tsvector) + missing FK indexes** — BUG-021, 108
10. **chore: error handling, dead code & minor cleanups** — BUG-006, 007, 025, 052, 065, 066, 071–110 subset
