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
| Staff users created | `test_secretary` (id 5, SECRETARY), `test_sales_clerk` (id 6, SALES_CLERK) — seeded to close RBAC test gap; password `TestPass123!` |
| Forwarder created | `BUGTEST Forwarder` (id 3) |
| Expense created | id 13 — UTILITIES ₱1.50 dated 2026-01-01, notes "BUGTEST" |
| Purchase order created | id 7 — supplier 2, product 5 ×5 PCS; **transitioned PENDING→FULFILLED with zero deliveries** (BUG-036 proof) |
| Shipment created | id 2 — transaction 9, forwarder 3, tracking `BUGTEST-TRK`; walked PENDING→DISPATCHED→PENDING (BUG-042 proof) |
| Approval requests created | ids 1–2 — `REFUND_TRANSACTION` with empty/garbage payloads (BUG-023 proof); approve attempt → 500, stays PENDING. ids 3–5 — real refunds on tx #9 all APPROVED (incl. concurrent-approve race → double restock, BUG-023/017 proof) |
| E2E flow mutations | PO #8 (fulfilled via delivery #4, +10 stock), PO #9 (delivery #5 with **factor 999 → +999 stock**, BUG-015 proof); shipment #2 now DELIVERED; credit sale `INV-2026-0007` ₱9 on customer 6; ₱5 cash settlement; product #5 stock now **1502** |
| Refund/exchange probes | Tx #11 (qty2 sale): refunds of qty 5+2+2 all APPROVED → +9 units restocked, ~₱727 paid out (BUG-149/150 proof). Tx #12: exchange + subsequent refund both APPROVED — double-dip (BUG-151). Tx #13: ₱80.78→₱116.65 exchange approved, ₱35.87 difference never collected (BUG-152). Approval ids 6–14; products 7590/7591 stock shifted |
| Credit-limit race | 3 parallel CREDIT checkouts (₱80.78 each, `override:true`) on customer 6 → all 201; balance ₱79,912 → **₱80,154.34, exceeding credit_limit ₱80,000** (BUG-037 live proof; BUG-125 override also exercised) |
| Phantom credit probe | Customer 4: CREDIT checkout ₱0.90 **without `details`** → balance +0.90 but no CreditPayment invoice — AR aging shows total 0.9 with all buckets 0, `hasOverdue:false` (BUG-171 live proof). Also: product 7600 base_uom PATCH→BOX→restored (BUG-153/178 proofs); split CASH+GCASH checkout ₱50+₱30.78 verified clean |
| Product catalog scaled | CSV seed run (`scripts/run-csv-seed.ts`): +2,571 products → then `scripts/scale-products.ts` added **+5,500 synthetic SKUs → 8,076 total** for latency testing |
| Checkouts | 2 × CASH checkout of 500 PCS product #5 (₱600 each) — product #5 stock is now **1500** (correct serialized value would be 1000 — see BUG-014 proof) |
| Wholesale balance | Customer #6 (Vanguard): two ₱100 payments recorded (ledger −₱200) but balance only fell ₱100 (BUG-032 proof); then a ₱1.20 fully-cash sale added phantom +₱5 AR via CREDIT payment (BUG-016 proof). Balance now 79,905 vs credit_limit 80,000 |

## Browser UI test results (Playwright, headless Chromium)

### Round 1 — smoke + POS sale
- **Login:** real UI login (`admin123`) → `/dashboard/pos` — works; all API calls 200.
- **Route sweep (admin):** all 18 dashboard routes HTTP 200, **zero console errors, zero page errors, zero failed API calls**.
- **POS sale E2E:** add to cart → PaymentModal (Cash/GCash, quick-tender, Complete-Sale gating) → ₱600 tender on ₱550 sale → `INV-2026-0006` created, cart cleared, receipt rendered. BUG-011 confirmed visually.
- **Receipt detail** (`/pos/receipt/9`): shows "Cash tendered ₱600 / Change ₱50" correctly (persisted receipt endpoint flattens properly); Refund/Exchange buttons present.

### Round 2 — multi-role sweep, modals, mobile, perf
- **RBAC matrix (live, 6 roles × 18 routes):**
  - ADMIN & MANAGER: all routes accessible.
  - CASHIER: blocked from adjustments/deliveries/POs/staff/admin pages (redirect to `/dashboard/pos`) — correct. **`/dashboard/suppliers` loads but `GET /suppliers` → 403** (BUG-044 confirmed live). `/dashboard/inventory/rop` loads with **no API error** — BUG-001's `/products` fetch accidentally masks the `/inventory/rop` 403.
  - **STOCK_MANAGEMENT, SECRETARY, SALES_CLERK: `ERR_TOO_MANY_REDIRECTS` on every navigation — BUG-113 confirmed for all three non-POS roles.** (SECRETARY/SALES_CLERK verified with newly seeded `test_secretary`/`test_sales_clerk` accounts.) SALES_CLERK `/dashboard/inventory/bins` loads (ungated route — BUG-044).
- **Modal sweep:** 12/12 create dialogs open cleanly (products 14 fields, customers, suppliers, staff, forwarders, bins, deliveries, POs, shipments "Log Shipment", expenses, system-settings) + inventory row-actions menu (Stock In/Out/Adjust/Assign Bin/Edit ROP) → Stock In dialog opens. Zero pageerrors.
- **Mobile viewport (390×844):** all 17 routes render; only `/inventory/adjustments` overflows by 1px (scrollW=391) — cosmetic.
- **Search perf:** `GET /products?search=` ~16–40ms across terms at current 5-product scale — trivially fast now; BUG-021 (no trigram indexes) remains a scale risk at 8k SKUs.
- **Print:** `@media print` in globals.css + `PrintableInvoice` + `window.print()` wired on receipt page/modal — works there. **Delivery "Print Receipt" is broken** (BUG-165: blank page — no print markup on that route).
- **Scripts:** `scripts/ui-smoke.mjs`, `ui-probe*.mjs`, `ui-flow.mjs`, `ui-sale*.mjs`, `ui-receipt.mjs`, `ui-roles.mjs`, `ui-modals*.mjs`, `ui-mobile.mjs`, `ui-inventory.mjs`, `ui-inv-actions.mjs` (Playwright devDependency added, uncommitted).

## Severity summary

| Severity | Count |
|---|---|
| High | 34 |
| Medium | ~78 |
| Low | ~79 |
| Informational | 7 |

Live-confirmed bugs are marked **[LIVE-CONFIRMED]**.

---

# HIGH SEVERITY

## BUG-001 — ROP page scans only the first page of products instead of using `/inventory/rop`
- **Location:** `lib/inventory/stock-rop-api.ts:10-23`
- `GET /products?limit=100` + client-side `current_quantity <= reorder_point_ROP` filter. Only first 100 products evaluated; backend `GET /inventory/rop` → `{items, totalAlerts}` exists and works (verified live).
- **Fix:** Call `/inventory/rop`.
- **Scenario:** Store manager opens the ROP page during reorder planning. A product at position 250 in the catalog is below its reorder point, but only the first 100 products are scanned — it never appears. The item stockouts and sales are lost before anyone notices.

## BUG-002 — POS catalog truncated to first 100 products **[now demonstrable]**
- **Location:** `lib/pos/services/pos-api.ts:139-163`
- Single `GET /products?limit=100`; client-side search/filter. ~7,900 of 8,000 SKUs unfindable/unbuyable; `ExchangeModal` picker affected too.
- **Scale proof:** catalog now holds **8,076 products** (target scale) — the POS can only see/search the first ~100 (**~1.2% of catalog**).
- **Scenario:** At the 8,076-SKU catalog, a cashier searches for a fastener that exists in the back room. The POS only loaded the first ~100 products, so search returns nothing and the sale can't be rung up — the customer leaves or the item is wrongly marked out of stock.

## BUG-003 — POS customer picker truncated to first 100 customers
- **Location:** `lib/pos/services/pos-api.ts:168-180`
- Wholesale customers past page 1 can't be attached to CREDIT checkouts. Live `GET /customers?limit=1` → `totalPages:6`.
- The customers *admin* table uses server-side pagination (`CustomerTable.tsx`), but the POS picker path is unchanged.
- **Scenario:** A wholesale account is customer #150. At checkout the cashier can't find them in the picker, so they either lose the credit sale or the transaction is forced to retail/cash pricing.

## BUG-004 — Transaction history truncated and fails silently
- **Location:** `lib/pos/services/pos-api.ts:490-545`
- `limit=100` once; `catch` returns `[]` → API failure looks like "no transactions".
- **Scenario:** After a busy day (>100 transactions), a cashier opens receipt history to process a return. Old receipts are missing, and if the API hiccups the page shows 'no transactions' — staff can't tell empty from failed, so legitimate returns get disputed.

## BUG-005 — Staff list truncated to first 100
- **Location:** `app/dashboard/staff/_components/StaffTable.tsx:92-96`
- **Scenario:** The business grows past 100 staff accounts. New hires beyond the cap never appear in the staff table — managers can't see, edit, or deactivate them.

## BUG-006 — StaffTable error handling bypasses `getErrorMessage`; maps non-existent `password_hash`
- **Location:** `StaffTable.tsx:98-127`; `lib/staff/types.ts:17`
- Live `GET /staff-users?limit=1` item keys: `id, username, first_name, last_name, assigned_role, is_active` — no `password_hash`.
- **Scenario:** An admin creates a staff account with a duplicate username. The backend returns a clear 409, but the UI shows 'Failed to save staff member' — the admin retries blindly instead of fixing the username. The password_hash mapping is dead code that will silently break if a hash is ever needed.

## BUG-007 — Duplicate `setError` calls in POS catalog hook
- **Location:** `lib/pos/hooks/use-pos-catalog.ts:23-24, 43-44`
- **Scenario:** No user-facing scenario — the second setError overwrites the first, so behavior is correct. Pure code hygiene; the risk is a future edit 'fixing' the wrong line.

## BUG-008 — Idempotency-Key is per-URL, not per-payload → stale cached responses on retry **[LIVE-CONFIRMED]**
- **Locations:** `lib/api.ts:47-58`; backend `src/common/interceptors/idempotency.interceptor.ts:34-51`
- **Live proof:** `POST /customers` twice with the same `Idempotency-Key` but different bodies → second request returned the **first** response (`BUGTEST Alpha` id 8 both times; Beta never created). Backend caches by key only for 24h.
- **Impact:** `POST /pos/checkout` (10s timeout) — committed-but-lost response → next checkout with a different cart returns the old receipt, clears the new cart. Same for customer/staff/supplier mutations.
- **Fix:** Key by body hash or fresh UUID per attempt.
- **Scenario:** A checkout commits server-side but the response times out. The cashier retries with a different cart; the backend returns the cached first receipt. The new cart is cleared and the customer is charged/receipted for the wrong sale. Proven live: two different customer creates with one key returned the same entity.

## BUG-009 — Cross-tab / multi-register refresh-token race forces logout
- **Locations:** `lib/api.ts:109-161`; backend `auth.service.ts:81-98` (single-use rotated refresh tokens)
- Per-tab mutex only; two tabs fire `/auth/refresh` concurrently → loser 401s → `handleLogoutRedirect()` clears shared `localStorage` → both sessions dead.
- **Scenario:** A cashier keeps the POS open in two tabs (or two registers share a browser profile). Both fire /auth/refresh at the same time; the loser's single-use token is rejected, the shared localStorage is wiped, and both terminals are logged out mid-shift — carts lost.

## BUG-010 — Auth cookie never refreshed → daily forced re-login + stale role + half-logout **[contract-verified]**
- **Locations:** `proxy.ts:39-51`, `app/api/auth/session/route.ts:18-26`, `lib/api.ts:143-146`
- Proxy authorizes on httpOnly cookie (`maxAge:24h`); refresh flow updates only `localStorage`. After 24h all `/dashboard` routes bounce to login despite valid 7-day refresh token; `/api/auth/me` reads stale cookie role; logout clears localStorage but not cookie → half-logged-in state.
- **Scenario:** A night-shift supervisor stays logged in past 24h. The proxy cookie expires at 24h while the refresh token lives 7 days — every page bounces to login despite a valid session. After a role change, /api/auth/me still reports the stale role from the cookie. On logout, localStorage clears but the cookie remains, leaving a half-logged-in state.

## BUG-011 — Checkout response payment shape mismatch → post-checkout receipt loses tender/change/GCash ref **[BROWSER-CONFIRMED]**
- **Location:** `lib/pos/services/pos-api.ts:403-444`; backend `checkout-transaction-response.dto.ts:100-105`
- **Browser proof:** Completed a ₱550 sale tendering ₱600 via Playwright. Backend response: `payments:[{payment_method:"CASH", amount_paid:550, details:{cash_tendered:"600", change_given:"50"}}]` (note: `details` values are **strings**). The post-checkout `ReceiptModal` showed only "Payment Cash Amount paid ₱550.00" — **no Cash tendered ₱600, no Change ₱50**.
- **Blast radius refined:** the persisted receipt page (`/dashboard/pos/receipt/9`, via `/transactions/receipt/:id` which flattens correctly) **does** show "Cash tendered ₱600.00 / Change ₱50.00" — only the immediate post-sale modal is affected.
- **Fix:** Map from `p.details` (with `Number()` coercion — values arrive as strings), or re-fetch the receipt endpoint after checkout.
- **Scenario:** A customer tenders ₱600 cash for a ₱550 sale. The receipt modal shows only 'Amount paid ₱550' — no tendered amount, no ₱50 change, no GCash reference. The cashier can't verify change was given correctly, and there's no audit trail of the actual tender.

## BUG-012 — Refund/exchange quantity in sold-UoM; backend expects BASE UoM
- **Locations:** `RefundModal.tsx:114-120`, `ExchangeModal.tsx:157-166`; backend `create-refund.dto.ts:27-33`, `returns.service.ts:93-96`
- Refund of 1 BOX (factor 100) computes ~1/100 correct amount; restock equally wrong. `maxQuantity` cap disagrees with backend units.
- **Scenario:** A customer returns 1 BOX (factor 100) of screws. The refund modal sends quantity in sold-UoM but the backend treats it as base units — the refund computes ~1/100 of the correct amount and restocks ~1/100 of the goods. Customer is under-refunded and inventory drifts.

## BUG-013 — Overdue-status field names mismatch → warning never displays **[LIVE-CONFIRMED]**
- **Locations:** `pos-api.ts:274-292`; backend `customer-overdue-status-response.dto.ts`
- Frontend reads `isOverdue`/`overdue`; backend returns `{hasOverdue, overdueCount, totalOverdueAmount}`. Live response confirmed. `CreditPaymentForm` never warns; cashier hits surprise block at checkout.
- `CustomerPaymentModal.tsx` (customer mgmt settlement) uses the correct `hasOverdue` shape — only the POS `CreditPaymentForm` path remains broken.
- **Scenario:** A cashier attaches a wholesale customer with overdue invoices. The overdue check returns hasOverdue but the frontend reads isOverdue — no warning shows. The cashier is surprised by a hard block at payment, causing a queue delay and a customer dispute at the counter.

## BUG-014 — Backend: stock decrement is read-modify-write → lost updates **[LIVE-CONFIRMED]**
- **Location:** `src/inventory/inventory.service.ts:278-333, 179-198, 99-147`
- **Live proof:** Two concurrent `POST /pos/checkout` × 500 PCS (stock 2000) → both 201, stock = **1500** not 1000. ₱1,200 revenue recorded; 500 units sold but never deducted. Same pattern in restock/adjust.
- **Fix:** Atomic `decrement`/`increment` or `SELECT … FOR UPDATE`.
- **Scenario:** Two registers sell the last 500 units of a product simultaneously. Both checkouts read stock=2000, both write 1500 — proven live. ₱1,200 in sales is recorded but 500 units were never deducted, so the system oversells and physical stock goes negative.

## BUG-015 — Backend: delivery receiving trusts client quantities; no over-receipt cap; state read outside tx **[LIVE-CONFIRMED — arbitrary stock inflation]**
- **Location:** `src/deliveries/deliveries.service.ts:48-73, 114-143, 182-297`
- `actual_base_quantity`/`uom_conversion_factor` accepted verbatim (can restock arbitrary qty); cumulative received never capped at `expected_base_quantity`; PO status + prior deliveries read before `prisma.$transaction` → concurrent deliveries both pass; WAC from stale product map.
- **Live proof:** `POST /deliveries` with `uom_conversion_factor:999, actual_base_quantity:999` for a 5-unit PO line → **stock inflated +999** (509→1508). A receiver can mint unlimited inventory by editing two fields. Partial mitigation observed: deliveries on a FULFILLED PO are rejected (400), and a full delivery auto-transitions the PO — but within a PENDING/PARTIAL PO the client-supplied factor/qty are trusted completely.
- **Scenario:** A receiver keys in a delivery quantity larger than shipped — the backend accepts it verbatim and restocks arbitrary amounts. Two receivers process partial deliveries of the same PO concurrently; both pass the state check and the PO/deliveries double-count received quantities.

## BUG-016 — Backend: POS credit — credit amount never reconciled; multiple CREDIT payments bypass checks **[LIVE-CONFIRMED]**
- **Location:** `src/pos/pos.service.ts:112-114, 128-145, 297-306, 351-375`
- **Live proof:** ₱1.20 sale paid `CASH 1.20 + CREDIT 5.00` → 201, `outstanding_balance` +₱5 despite sale fully covered by cash. AR inflated arbitrarily; `cash_tendered`/`change_given` trusted client-side; overpayment accepted with no change computation; only first CREDIT payment counted for limit/balance but all persisted.
- **Second live proof:** credit checkout for a ₱9 sale with `amount_paid:12` → balance +**₱12** (client `amount_paid` trusted over computed `grand_total`).
- **Scenario:** A cashier splits a ₱1.20 sale as CASH ₱1.20 + CREDIT ₱5.00. The backend records ₱5 phantom AR against the customer despite the sale being fully covered — proven live. The customer's balance inflates arbitrarily, eventually blocking legitimate credit sales and corrupting AR aging reports.

## BUG-017 — Backend: refund/exchange handlers never validate quantity → over-refund/over-restock/negative balances **[LIVE-CONFIRMED]**
- **Location:** `src/returns/handlers/refund/refund-approval.handler.ts:49-85`, `exchange-approval.handler.ts:53-104`, `returns.service.ts:65-130`
- `findFirst` on `(transactionId, productId)` collapses duplicate lines; quantity never checked vs sold or cumulative prior returns; `remaining_credit_balance` decremented with no floor → negative; `TransactionStatus.REFUNDED`/`PARTIALLY_REFUNDED` never written → refunded sales still count as revenue.
- **Live proof:** tx #9 sold 1 BOX of product 5. Three separate `POST /returns/refund` + approve cycles for the same item all succeeded — stock restocked +1 three times (`RETURN RESTOCK` movement rows confirmed). No cumulative-return cap exists.
- **Scenario:** An approver clicks approve twice on a refund (or two approvers race). Quantity is never validated against sold/cumulative returns — the customer gets double-refunded and inventory double-restocked. Repeated over-refunds drive remaining_credit_balance negative and refunded sales still count as revenue forever.

## BUG-018 — Backend: logout is a no-op — refresh tokens never revoked **[code-verified end-to-end]**
- **Location:** `src/auth/auth.controller.ts:51-58`, `jwt.strategy.ts:33-47`, `auth.service.ts:101-106`
- `logout()` reads `req.user?.tokenId`, but `JwtStrategy.validate()` returns the DB user object which has **no `tokenId`** (only the refresh payload carries it). `cacheManager.del('refresh_token:{userId}:')` targets a key that never exists → `{success:true}` but the 7-day refresh token stays valid. Stolen tokens can't be revoked.
- **Scenario:** A staff laptop is stolen. The user 'logs out' but the refresh token is never revoked — the attacker replays it for up to 7 days and keeps full API access. There is no way to cut off a compromised session.

## BUG-019 — Backend: `x-mock-role` header bypasses all authentication when `NODE_ENV !== 'production'`
- **Location:** `src/auth/guards/jwt-auth.guard.ts:8-22`
- Any request with `x-mock-role: ADMIN` skips JWT and injects a mock user whenever `NODE_ENV` isn't literally `'production'` — same gate as Swagger (`main.ts:43`). If deployed without `NODE_ENV=production` (common PM2/Docker default), unauthenticated full-admin access. Secondary: mock user uses `userId` not `id` → `staffId: undefined` reaches Prisma.
- **Fix:** Gate behind explicit env flag, fail closed.
- **Scenario:** The API is deployed to staging or a PM2/Docker environment without NODE_ENV=production. Anyone on the network can send `x-mock-role: ADMIN` with no credentials and get full admin access to every endpoint — a complete auth bypass.

## BUG-020 — Backend: refresh token doubles as access token when `JWT_REFRESH_SECRET` unset
- **Location:** `src/auth/auth.service.ts:118-120`, `jwt-refresh.strategy.ts:13-15`, `jwt.strategy.ts:14-22`
- `refreshSecret = JWT_REFRESH_SECRET || JWT_SECRET`. If unset, refresh tokens sign with the access secret; the refresh payload passes `JwtStrategy.validate()` → a 7-day refresh token works as a bearer access token on every guarded route, defeating the 15-min access design.
- **Fix:** Mandate `JWT_REFRESH_SECRET` at boot or reject refresh tokens in the access strategy (e.g., check `tokenId` presence).
- **Scenario:** Ops forgets to set JWT_REFRESH_SECRET. Refresh tokens get signed with the access secret, so a leaked 7-day refresh token works as a bearer token on every route — the 15-minute access-token design is defeated.

## BUG-021 — Backend: product search cannot meet <100ms rule — no trigram/full-text indexes **[measured]**
- **Location:** `prisma/schema.prisma:329-376`; query `products.service.ts:44-67`
- Search = AND of per-keyword OR `contains … insensitive` across name/sku/size/thread/material. Only `@@index([name])` btree — useless for `ILIKE '%kw%'`. No pg_trgm GIN or tsvector despite AGENT.md mandate. Every search = sequential scan.
- **Measured live:**
  - **2,576 SKUs:** `search=screw` 30–40ms, `search=hexagonal` ~32–39ms, `search=anchor` 33–62ms, multi-keyword ~75ms — under the rule.
  - **8,076 SKUs (target scale):** `search=screw` 46–104ms, `search=cable tie m6` **88–119ms**, `search=bolt m8 zinc` ~83ms, `search=hexagonal` ~55ms, attribute filters ~28–35ms, plain pages ~26–52ms, `/inventory/rop` ~12–20ms. **Multi-keyword searches breach the <100ms rule at target scale** — seq-scan cost scales linearly. Add pg_trgm GIN indexes before production.
- **Scenario:** At 8,076 SKUs a cashier types 'cable tie m6' at the POS — measured 88–119ms, breaching the <100ms rule. Searches get slower as data grows; on slower warehouse hardware or under concurrent load it will feel laggy at the counter.

## BUG-022 — Backend: idempotency interceptor is non-atomic and unscoped
- **Location:** `src/common/interceptors/idempotency.interceptor.ts:34-59`
- `get → check → set(IN_PROGRESS)` has no atomic NX — two concurrent same-key requests both execute the handler (double checkout/expense/approval). Cache key `idempotency:${key}` has **no user/route scope** → cross-endpoint/cross-user replay of cached bodies. `tap` doesn't await caching; crash leaves `IN_PROGRESS` → 409 for 24h.
- **Scenario:** Two identical checkout requests arrive concurrently (retry + original, or double-click). The non-atomic get-then-set lets both execute the handler — double sale, double stock deduction, double payment records.

## BUG-023 — Backend: approval double-approve race + self-approval + unscoped reads **[LIVE-CONFIRMED]**
- **Location:** `src/approval/approval.service.ts:55-90,92-124`, `approval.controller.ts`
- Check-then-act on `status===PENDING` under READ COMMITTED → concurrent approves both execute handler (double refund/restock). No `requestedById !== reviewerId` check → managers can approve own requests. `GET /approval` has no `@Roles` → any authenticated CASHIER enumerates all requests incl. payload JSON. `createRequest` payload `IsObject`-only; handlers trust client-supplied breakdown values.
- **Live proof:** `POST /approval {type:"REFUND_TRANSACTION", payload:{}}` → **201 PENDING**; same with `payload:{transaction_id:"abc"}` → **201**. `PATCH /approval/1/approve` (as the same admin who created it — no self-approval block) → **500**, request stays PENDING forever → zombie un-approvable requests. `GET /approval?status=BOGUS` → **500** `{statusCode,message}` (no `details` wrapper — also BUG-058/111).
- **Race proof:** 3 concurrent `PATCH /approval/5/approve` → **two returned 200 APPROVED** and the stock-movement log shows **two `RETURN RESTOCK` entries** — the check-then-act let both requests execute the refund handler. Double restock confirmed live.
- **Scenario:** A manager creates a REFUND_TRANSACTION approval with an empty payload — accepted (proven live: 201). Approving it 500s and the request stays PENDING forever, clogging the queue. The same manager can approve their own request (no self-approval check), and any cashier can enumerate every approval payload including customer data.

## BUG-125 — `POST /pos/checkout` `override` flag lets any cashier self-authorize negative stock AND overdue-credit bypass
- **Severity:** High
- **Locations:** `src/pos/pos.service.ts:178` (overdue block gated by `!checkoutDto.override`), `:321` (`allowOverride` → `reduceProductStock`); `checkout.dto.ts:65-73`; controller allows CASHIER/SALES_CLERK/SECRETARY
- One client boolean bypasses both the insufficient-stock check and the overdue-invoice credit block — no role gate, no approval, same flag for both.
- **Live proof:** CREDIT checkout on customer 6 with overdue invoices → 403 without flag; identical request with `override:true` → proceeded to payment validation (only failed on amount mismatch). Overdue block bypassed by any cashier.
- **Scenario:** A cashier sells stock that doesn't exist, or pushes an overdue customer through credit checkout, by adding `"override": true` — every stock/credit safeguard is self-service.
- **Fix:** Split into role-gated overrides; require MANAGER+ or route credit override through approvals.

## BUG-126 — Same product in two UoMs on one PO → guaranteed 500
- **Severity:** High (latent)
- **Locations:** `purchase-orders.service.ts:103-131` (dedupe key `${productId}_${uom}`) vs `schema.prisma:482` (`@@unique([poId, productId])`)
- Ordering product #5 as both PCS and BOX emits two `poItems` rows with same productId → P2002 → 500. UI encourages multi-UoM ordering.
- **Scenario:** A buyer orders screws by the piece AND by the box in one PO — submission 500s with no explanation; the order can't be placed.
- **Fix:** Consolidate to one row per productId or widen unique to include `ordered_uom`.

## BUG-149 — Refund quantity never validated against sold quantity → over-refund pays out more than the sale **[LIVE-CONFIRMED]**
- **Severity:** High
- **Locations:** `returns.service.ts` (`requestRefund`/`calculateRefundBreakdown` — no check that `quantity <= transactionItem.quantity_sold` converted to base UoM); `create-refund.dto.ts:31-33` (`@IsPositive` only)
- **Live proof:** Sold qty 2 of product 7590 (line total ₱161.56). `POST /returns/refund {quantity:5}` → 201; approval #6 APPROVED → `Return` row for 5 units, `refund_amount` ₱403.90 (**2.5× the line total**), `cashPayoutAmount` ₱403.90, and +5 units restocked.
- **Scenario:** A customer buys 2 bolts and "returns" 5 — the system pays out ₱403.90 cash for a ₱161.56 sale and restocks phantom inventory. Repeatable across any transaction.
- **Fix:** Validate cumulative refunded qty per transaction item ≤ sold qty (base UoM) at request time.

## BUG-150 — No cumulative refund tracking → unlimited repeat refunds on the same item **[LIVE-CONFIRMED]**
- **Severity:** High
- **Locations:** same as BUG-149 — nothing records or checks prior `Return`/`Exchange` rows against `transactionItem`
- **Live proof:** Tx #11 sold qty 2. Three refunds approved on the same item: qty 5 + qty 2 + qty 2 = **9 units restocked** (movement log ids 40/41/42: +2, +5, +2 → stock 128→137) and cash payouts issued for each. A 2-unit sale generated 9 units of inventory and ~₱727 in refunds.
- **Scenario:** A cashier processes the same receipt three times — the customer walks out with triple the money and the warehouse gains phantom stock that will be sold to the next customer.
- **Fix:** Sum existing Return quantities per (transactionId, productId) and reject requests exceeding remaining returnable qty.

## BUG-151 — Refund approved after exchange on same item → customer gets replacement AND refund (double-dip) **[LIVE-CONFIRMED]**
- **Severity:** High
- **Locations:** `returns.service.ts` — `requestRefund` doesn't check for existing `Exchange` rows on the transaction item; `exchange-approval.handler.ts` creates a `Return` row too, further confusing cumulative tracking
- **Live proof:** Tx #12 item exchanged (approval #9 APPROVED → new product 7591 deducted) then refunded (approval #10 APPROVED → `Return` + cash payout on the same item). Both succeeded — customer received the exchange item and the refund.
- **Scenario:** Customer exchanges a defective part for a new one, then files a refund on the original receipt — approved. They keep the new part AND get their money back.
- **Fix:** Treat exchange as consuming returnable quantity; block refunds once an exchange exists for the item (and vice versa).

## BUG-153 — `base_uom` mutable without converting stock or UoM factors → quantities reinterpreted **[LIVE-CONFIRMED]**
- **Severity:** High
- **Locations:** `products.service.ts:398-415` (blocks `base_uom` change only when `stockMovement.count > 0`), `:565-596` (updates `base_uom` without touching `current_quantity`/`ProductUom.conversion_factor`); `update-product.dto.ts:8-15` (`confirmUomChange` documented but never enforced); `schema.prisma:62-63,342,383-385`
- Opening stock written at create produces no `StockMovement` → `stockMovementCount=0` → `PATCH {base_uom:"BOX"}` succeeds; stored `current_quantity=100` is now read as **100 BOX**, and existing UoM rows still say `1 BOX = 100 BOX`.
- **Live proof:** `PATCH /products/7600 {base_uom:"BOX"}` (qty 113, zero movements) → 200; product then read `base_uom:BOX, current_quantity:113` — 113 PCS silently became 113 BOX. Restored to PCS afterward.
- **Scenario:** A product created with 100 PCS opening stock gets its base_uom switched to BOX. The system now believes it holds 100 BOX (10,000+ PCS worth) — sales, WAC, and reorders are all wrong, and the UoM table contradicts itself.
- **Fix:** Block `base_uom` changes whenever `current_quantity > 0` or UoM rows exist; honor `confirmUomChange` or remove it.

## BUG-154 — Approval approve-vs-reject race: side effects execute but request can end REJECTED **[code-verified]**
- **Severity:** High
- **Locations:** `approval.service.ts:55-84` (approve: read PENDING → execute handler → update APPROVED, all in tx) vs `:92-124` (reject: reads PENDING *outside* a transaction, then unconditionally updates REJECTED)
- Manager A approves a refund while Manager B rejects the same request — B's unconditional REJECTED update can land after A's handler already restocked/refunded, leaving financial/inventory side effects on a "REJECTED" request.
- **Scenario:** Two managers act on the same refund at once — one approves, one rejects. The refund executes (stock restocked, balance decremented) but the record shows REJECTED, or vice versa — the audit trail contradicts what actually happened to inventory and money.
- **Fix:** Do the PENDING check + status update atomically in both paths (single conditional `updateMany({status:PENDING})` guard).

## BUG-165 — Delivery "Print Receipt" prints a completely blank page **[code-verified]**
- **Severity:** High
- **Locations:** `DeliveryDetailViewModal.tsx:85-87,213-224` (`window.print()` only); `globals.css:153-190` (`@media print` hides `body *` except `.print-only`/`#printable-receipt`); no print markup exists on the deliveries route — the only `PrintableInvoice` usages are under `app/dashboard/pos/receipt/`
- **Scenario:** Staff opens a delivery and clicks "Print Receipt" — the print dialog produces a blank page. Receiving clerks can't produce the goods-received document the business needs for disputes and audits; the button is 100% nonfunctional.
- **Fix:** Add print-only delivery receipt markup or a scoped `@media print` rule for the modal.

## BUG-171 — CREDIT payment without `details` inflates balance but creates NO `CreditPayment` invoice → phantom debt **[LIVE-CONFIRMED]**
- **Severity:** High (latent — UI always sends `details.date`, but API permits omission)
- **Locations:** `payment.dto.ts:75-90` (`details` optional for all methods); `pos.service.ts:351-361` (`creditPayment` row created only when `details` present) vs `:369-375` (`adjustWholesaleBalance` runs regardless)
- **Live proof:** `POST /pos/checkout` customer 4, CREDIT ₱0.90 **without details** → 201; `outstanding_balance` 0→0.90 but AR aging shows the customer with `total=0.9` and **all buckets 0** — debt exists in the macro balance but is invisible to aging buckets, overdue checks (`hasOverdue:false`), and FIFO settlement.
- **Scenario:** Any API client (or future UI regression) checks out on credit without a due date — the customer's balance grows, but no invoice exists: AR aging shows ₱0 in every bucket, the customer never goes overdue, and payments can't be allocated against the debt. Bad debt accumulates silently.
- **Fix:** Require `details` for CREDIT (`@IsNotEmpty` conditional) or always create the CreditPayment row with a default date.

## BUG-179 — MANAGER can create/promote ADMIN accounts and modify/deactivate admins — no role hierarchy **[code-verified]**
- **Severity:** High
- **Locations:** `staff-user.controller.ts:39-57` (POST allows ADMIN/MANAGER), `:95-117` (PATCH allows ADMIN/MANAGER); DTOs accept any `AssignedRole` incl. ADMIN; `staff-user.service.ts` has no actor/target hierarchy or self-modification checks; `jwt.strategy.ts:33-47` reloads role from DB per request → escalation is effective on existing tokens immediately.
- **Scenario:** A manager creates a staff account with `assigned_role:"ADMIN"` and a password they know — instant full admin access. Or PATCHes an existing admin's password/`is_active:false` — locking out the real admin. Any manager can silently take over the system.
- **Fix:** Restrict ADMIN-role assignment and admin-target modifications to ADMIN only; block self-role-change; add hierarchy checks.

---

# MEDIUM SEVERITY

## BUG-024 — Pending refund/exchange breakdown field names don't match backend payload
- `receipt/[id]/page.tsx:293-309` reads `creditDebtCancellation`/`cashPayout`/`totalRefund`; backend stores `{totalRefundAmount, creditDebtReduction, cashPayoutAmount, originalPayments}` → pending card always ₱0.00.
- **Scenario:** A manager opens a pending refund on the receipt page to review amounts before approving. The breakdown card shows ₱0.00 because the field names don't match — the manager approves a refund blind, potentially paying out the wrong amount.

## BUG-025 — Backend error messages swallowed: components read `data.message`, backend sends `data.details.message` **[LIVE-CONFIRMED shape]**
- **Locations:** `SupplierTable.tsx:96,121,142`; `StaffTable.tsx:123-127,209-212`; `AddStaffModal.tsx:104-111`; `RefundModal.tsx:62-76`; `ExchangeModal.tsx` ~95; `bins/page.tsx:70`; `bins/_components/AddBinModal.tsx:91`; `products/_components/DeleteProductDialog.tsx:54-55`
- **Live proof:** error body keys are `{statusCode, timestamp, path, details}` — no top-level `message`. Every backend error in these components shows a generic string (e.g., duplicate-username 409 → "Failed to save staff member.").
- **Scenario:** An admin tries to create a staff account with a taken username. Backend returns a descriptive 409, but every listed component reads data.message (absent) and shows a generic failure — users can't tell duplicate-username from server-down and retry pointlessly.

## BUG-026 — Stock movement history filters apply only to current page of 20
- `adjustments/page.tsx:177-249` — client-side filter on one page; `GetStockMovementsDto` lacks search/size/thread/material/categoryId (sending → 400). `fetchMatchingProductIds` loops all `/products` (~80 requests at 8k SKUs) per filter change.
- **Scenario:** An auditor filters stock movements by size M8 to investigate shrinkage. Only the current page of 20 records is filtered client-side — matching movements on other pages are invisible, so the investigation misses most of the data. Each filter change also fires ~80 paginated product requests.

## BUG-027 — Receive Delivery blocks backend-accepted deliveries; mis-measures partial POs
- `ReceiveDeliveryModal.tsx:178,193-195,445-446` — caps at full `expected_base_quantity`, not remaining; over-shipments can't be recorded; partial-PO second deliveries can silently over-receive.
- **Scenario:** A supplier ships 120 units against an expected 100. The receive modal caps input at the full expected quantity, so the overage can't be recorded. On a second partial delivery, cumulative received isn't tracked — the UI can silently allow receiving more than was ever shipped.

## BUG-028 — PO selector truncates at 50 POs, page 1 only
- `POSelectList.tsx:37-45`; `delivery-api.ts:66-86` — client-side filters FULFILLED/CANCELLED; backend `status` param unused.
- **Scenario:** The business accumulates >50 purchase orders. An open PO from last month sorts past the first page — it never appears in the delivery selector, so its delivery can't be recorded and the three-stage intake stalls.

## BUG-029 — `fetchReceivedBaseByProduct` truncates at 100 deliveries
- `purchase-order-api.ts:70-84` — PO with >100 deliveries → wrong received totals/badges.
- **Scenario:** A high-volume PO accumulates >100 deliveries. fetchReceivedBaseByProduct only reads the first 100 — received totals and PO badges understate reality, triggering premature reorders or false 'complete' states.

## BUG-030 — `fetchEligibleTransactions` lists only 10 recent completed orders
- `shipment-api.ts:97-112` — older unshipped orders unreachable without guessing invoice/customer.
- **Scenario:** An order from three weeks ago was never shipped. In the shipment modal only the 10 most recent completed orders are listed — staff must guess invoice numbers to find it, and unshipped orders silently age.

## BUG-031 — Supplier dropdown in PO form truncates at 100
- `CreatePurchaseOrderForm.tsx:67`
- **Scenario:** The supplier master grows past 100. A supplier missing from the PO form's dropdown can't receive purchase orders — procurement for them is blocked with no explanation.

## BUG-032 — Supplier delete of PO-linked supplier: backend deactivates + 409; UI shows error, never reloads
- `SupplierTable.tsx:127-147`; backend `suppliers.service.ts:185-198` — row stays ACTIVE-looking until manual refresh.
- **Scenario:** A manager deletes a supplier who has PO history. Backend deactivates them and returns 409; the UI shows an error but never reloads — the row still looks active, so the manager retries and files a bug instead of understanding the supplier was soft-deleted.

## BUG-033 — Inactive suppliers can never be reactivated via UI
- `SupplierModal.tsx` has no status control; `status`→`is_active` mapping exists but unreachable.
- **Scenario:** A supplier is deactivated (manually or via BUG-032). There is no status control in the edit modal — the supplier can never be reactivated through the UI; only an API call or DB edit revives them.

## BUG-034 — Cashier editing WHOLESALE customer always 403s
- `AddCustomerModal.tsx:93-110` sends `type` unconditionally; backend treats wholesale-field PATCH as ADMIN/MANAGER/SECRETARY (compounded by BUG-051's generic 403 text).
- **Scenario:** A cashier needs to fix a typo in a wholesale customer's phone number. The edit modal always submits type=WHOLESALE, the backend treats wholesale-field edits as manager-only, and the save 403s — cashiers can't maintain customer records at all.

## BUG-035 — Duplicate-contact 409 has no recovery path
- `AddCustomerModal.tsx:115-120`; backend `allowDuplicate` + structured `DUPLICATE_CUSTOMER_CONTACT` payload unused.
- **Scenario:** A customer shares a phone number with a spouse's account. The create fails with a 409 but the UI offers no path — the backend supports allowDuplicate and returns a structured payload the frontend ignores, so staff can't resolve it without admin intervention.

## BUG-036 — Backend: PO status allows arbitrary transitions **[LIVE-CONFIRMED]**
- `purchase-orders.service.ts:357-419` — `PENDING→FULFILLED` with zero deliveries, regressions, etc. No state machine.
- **Live proof:** created PO #7 (PENDING, 0 deliveries) → `PATCH /purchase-orders/7/status {po_status:"FULFILLED"}` → **200, status now FULFILLED**. FULFILLED is terminal and deliveries only accept PENDING/PARTIALLY_FULFILLED → a wrongly-fulfilled PO can **never** receive its goods (no regression path).
- **Scenario:** A manager marks a PENDING purchase order FULFILLED with zero deliveries — proven live (PO #7). Procurement records claim goods arrived that never did; the PO is then permanently bricked — when the real shipment arrives, receiving 400s forever with no way to reopen it.

## BUG-037 — Backend: credit-limit check TOCTOU on `outstanding_balance` **[LIVE-CONFIRMED]**
- `pos.service.ts:128-145` + `customers.service.ts:401-432` — concurrent credit checkouts both pass.
- **Live proof:** Vanguard balance ₱79,912 / limit ₱80,000 (headroom ₱88). Three parallel CREDIT checkouts of ₱80.78 each → **all three 201**; balance now **₱80,154.34 — exceeds credit_limit by ₱154.34**. (Required `override:true` to bypass the unrelated overdue block — itself BUG-125.)
- **Scenario:** Two cashiers process credit sales for the same customer near their credit limit simultaneously — proven live: 3 parallel sales pushed the balance ₱154 over the limit. The customer exceeds their credit limit and the store carries unapproved bad-debt exposure.

## BUG-038 — Backend: `collectWholesalePayment` lost-update race **[LIVE-CONFIRMED]**
- `customers.service.ts:461-570`
- **Live proof:** Two concurrent ₱100 payments vs ₱80,000 balance → both 201, balance fell only ₱100. Two `CustomerPayment` audit rows + FIFO settlements total ₱200 vs ₱100 balance change — ledger/balance diverge.
- **Scenario:** Two staff collect ₱100 payments from the same wholesale customer at the same time. Both succeed (proven live) but the balance only drops ₱100 while two ₱100 ledger entries exist — AR reports diverge from actual balances and FIFO settlement records become untrustworthy.

## BUG-039 — Backend: dashboard gross margin is 10× too small **[LIVE-CONFIRMED]**
- `analytics.service.ts:131-132` — `* 10` should be `* 100` (net margin line 136 correct). Live `dashboard-summary` → `gross_profit.margin_percentage: 4.18` vs expected ~41.8.
- **Scenario:** Executives open the analytics dashboard and see 4.18% gross margin instead of ~41.8% (proven live — the code multiplies by 10 instead of 100). Pricing, purchasing, and viability decisions get made on margins that are 10× understated.

## BUG-040 — Backend: return window off-by-one (~8 days) + no defect-tag verification
- `returns.service.ts:27-63` — `floor(diffDays) <= 7` passes 7d23h; negative diffs pass; AGENT.md defect-tag requirement unimplemented.
- **Scenario:** A customer returns an item on day 8 claiming it's within policy — floor(diffDays)<=7 actually accepts up to ~7d23h, and there's no defect-tag verification despite the AGENT.md requirement. Fraudulent or abused returns slip through.

## BUG-041 — Backend: exchange valuation ignores tier/UoM/discounts; price difference never settled
- `exchange-approval.handler.ts:77-115` — always retail price; `price_difference` stored but no payment/refund/AR adjustment → upgrade collects nothing, downgrade refunds nothing.
- **Scenario:** A customer exchanges a ₱50 item for a ₱500 item. The exchange values everything at retail price, ignores UoM/tier/discounts, and the price_difference is stored but never settled — the store gives away ₱450 of margin with no payment collected or refund issued.

## BUG-042 — Backend: shipment state machine regressions + racy dup check + hard delete **[LIVE-CONFIRMED partial]**
- `shipments.service.ts:93-107,206-226,412-428` — `DISPATCHED→PENDING` allowed; same-status no-ops; dup check outside tx; `deleteShipment` hard-deletes audit trail.
- **Live proof:** shipment #2 walked `PENDING → DISPATCHED → PENDING` via `PATCH /shipments/2/status` — regression accepted. Refined by further probes: `PENDING→DELIVERED` correctly 400s ("Allowed flow: PENDING -> DISPATCHED -> DELIVERED") and `DELIVERED→PENDING` correctly 400s ("already delivered") — so the hole is specifically **DISPATCHED→PENDING** (and presumably same-status no-ops). Duplicate active shipment for same transaction correctly 409s.
- **Scenario:** A shipment marked DISPATCHED is regressed to PENDING (proven live) — tracking history and delivery SLAs become meaningless. Deleting a shipment hard-deletes the audit record, so 'where did this order go' becomes unanswerable.

## BUG-043 — Backend: `endDate` `lte` excludes entire end day **[LIVE-CONFIRMED]**
- `analytics.service.ts:66,178,387,523`; `transactions.service.ts:63-68`; `deliveries.service.ts:328-332`; `purchase-orders.service.ts:301-309`; `inventory.service.ts:497-503`; `expenses.service.ts`
- **Live proof:** `GET /transactions?startDate=2026-11-14&endDate=2026-11-14` → **0** results; same range with `T23:59:59.999Z` → **3**. Date-only endDate systematically drops the whole end day across every date-filtered endpoint.
- **Scenario:** A manager runs a report for 'today only' using date inputs. The endDate is treated as exclusive-ish lte on midnight — proven live: the whole end day returns zero results while the correct boundary returns 3 records. Daily sales/expense/PO reports systematically undercount the final day.

## BUG-044 — Role/permission mismatches both directions
- `lib/auth/roles.ts` + `layout.tsx` vs backend `@Roles`:
  - UI shows, API 403s: `/dashboard/suppliers` (CASHIER), `/dashboard/inventory/rop` (CASHIER/SALES_CLERK), ungated forwarder/product/supplier/bin mutation buttons, Deliveries nav for CASHIER/SALES_CLERK.
  - API allows, UI blocks: POS+receipts for SALES_CLERK/SECRETARY/STOCK_MANAGEMENT; expenses for SECRETARY (backend allows on all expense endpoints); `/inventory/movements` view for SECRETARY.
  - `layout.tsx` nav children for Suppliers/Forwarders/Staff/Products/Deliveries/Shipments/ROP/Bins still have **no** `allowedRoles`; `roles.ts` still lacks entries for `/dashboard/suppliers`, `/dashboard/forwarders`, `/dashboard/inventory/bins`, `/dashboard/inventory/shipments` → all roles pass those routes while APIs 403. `lib/auth/permissions.ts` matches `shipments.controller.ts` `@Roles` exactly — extend this pattern to the other modules.
- **Fix:** Single source of truth mapping routes ↔ `@Roles`.
- **Scenario:** A cashier clicks Suppliers in the nav — the page loads but every API call 403s (proven live), a dead-end with no explanation. Meanwhile a secretary is blocked from the expenses UI even though the backend allows them. Both directions of the role map drift until a single source of truth exists.

## BUG-045 — `fetchReceiptApi` never requests returns/exchanges; `already_returned_qty` never populated
- `pos-api.ts:573-578`; backend defaults `includeReturns/Exchanges`=false; `transactions.service.ts:100-102` never passes it. Receipt reconstructs from `/approval` only → misses other channels; return modals can't cap prior returns.
- **Scenario:** A customer returns part of a previous purchase. The receipt page can't show accurate 'already returned' quantities because includeReturns was never requested — the return modal's cap is wrong, enabling over-returns beyond what was sold.

## BUG-046 — Adjustments date filters use UTC-midnight parsing
- `adjustments/page.tsx:190-195` — `new Date("YYYY-MM-DD")` = UTC midnight → PH end-date excludes everything after 08:00 local; inconsistent with expenses page's correct local-time handling. The same midnight `endDate` boundary bug also exists in `POSelectList.tsx` (delivery PO selector).
- **Scenario:** A staff member in Manila filters stock adjustments for Nov 14. The endDate parses as UTC midnight — everything after 8:00 AM local is excluded, so the day's variances look clean when they're not. The PO selector has the same bug.

## BUG-047 — `formatDateToInput` uses `toISOString()` → off-by-one-day in PH mornings
- `CreditPaymentForm.tsx:37-39` — 00:00–08:00 PHT yields yesterday for due-date default/`min`.
- **Scenario:** At 7:00 AM Philippine time, a cashier opens the credit form. formatDateToInput converts via toISOString — the due-date default and min show yesterday, so credit terms start a day early.

## BUG-048 — Customer switch to walk-in/retail after WHOLESALE items → guaranteed 403
- `pos/page.tsx:169-176`, `PosCart.tsx`, `pos-api.ts:198-216` — no reprice/warning; `transaction_type:WHOLESALE` + non-wholesale customer → `ForbiddenException`.
- **Scenario:** A cashier builds a cart with wholesale-priced items, then switches the customer to walk-in to finish the sale. The cart still emits transaction_type:WHOLESALE — checkout 403s at the last step, forcing the cashier to rebuild the cart at the counter.

## BUG-049 — Line discount not capped; frontend/backend total math diverges
- `use-pos-cart.ts:13-25,219-242`, `CartItemRow.tsx:102-112`; backend `pos.service.ts:274-295` — backend subtracts Σ discounts from order total, no cap → discount > line gross eats other lines / negative grand_total; displayed ≠ charged.
- The cart was rewritten — `calcLineSubtotal` now clamps `subtotal`/`line_discount` ≥ 0, but `line_discount` is still **not capped at line gross** → divergence persists for over-discounted lines.
- **Scenario:** A cashier applies a line discount larger than the item's price (e.g., promo error). The subtotal clamps at 0 but the discount itself isn't capped — the backend subtracts the full discount from the order total, so the charged amount diverges from what the screen showed.

## BUG-050 — UoM wholesale price priority differs from backend
- `use-pos-cart.ts:57-75`, `ProductCard.tsx:63-88`; backend `pos.service.ts:244-254` — UoM explicit `retail_price` (no wholesale) + product `wholesale_price` → frontend shows `wholesale×factor`, backend charges `uom.retail_price`.
- `resolveUomPrice` prefers backend `calculated_*` fields, but the priority order still doesn't match backend (`uom.retail_price` must outrank base-wholesale×factor for wholesale transactions).
- **Scenario:** A wholesale customer buys an item sold by the BOX where the BOX UoM has an explicit retail price but no wholesale price. The POS displays wholesale_price×factor, but the backend charges the UoM's retail price — customer disputes the invoice and the receipt doesn't match the shelf quote.

## BUG-051 — `getErrorMessage` discards backend message on 403
- `lib/utils.ts:33-35` — hardcoded "Access denied" ignores `details.message` for all modules.
- **Scenario:** Any user hits a 403 — e.g., a cashier trying a manager action. Instead of the backend's explanation ('wholesale fields require manager role'), every module shows a flat 'Access denied', so nobody can tell a permissions issue from a bug.

## BUG-052 — Silent error swallowing in POS fetchers
- `pos-api.ts`: `fetchTransactionsApi`→`[]`; overdue catch→false; categories `.catch(()=>({data:[]}))`→names degrade to "General"; receipt invoice-search fallback swallows.
- **Scenario:** The transactions API fails during a busy period. fetchTransactionsApi returns [] — the POS receipt list shows 'no transactions' and staff assume sales weren't recorded, potentially re-ringing sales or escalating a false incident.

## BUG-053 — Backend: inactive staff retain access until token expiry
- `jwt.strategy.ts:33-47` — `validate()` doesn't check `is_active`; deactivated users transact up to 15 min. Refresh correctly blocked.
- **Scenario:** A cashier is terminated for cause. Their access token remains valid for up to 15 minutes — they can still process sales and refunds in that window. Refresh is blocked, but the gap is enough for abuse.

## BUG-054 — Backend: refresh rotation is check-then-delete (non-atomic)
- `auth.service.ts:81-98` — concurrent `/auth/refresh` with same token both pass hash check → two valid pairs (replay window). No reuse-detection/family revocation.
- **Scenario:** A refresh token is replayed concurrently (two tabs or an attacker with a copy). The check-then-delete rotation lets both requests pass — two valid token pairs exist, widening the theft window with no reuse detection or family revocation.

## BUG-055 — Backend: hardcoded 7-day Redis TTL ignores `JWT_REFRESH_EXPIRATION`
- `auth.service.ts:125-128,144` — TTL mismatch → silent session loss if JWT expiry >7d.
- **Scenario:** Ops sets JWT_REFRESH_EXPIRATION=30d for convenience, but Redis TTL stays hardcoded at 7 days. Sessions silently die at day 7 — users re-login daily with no error explaining why.

## BUG-056 — Backend: expense hard-delete + unbounded pagination
- `expenses.service.ts:95-103,234-255` — `prisma.expense.delete` violates audit-immutability; `limit` unbounded (`limit=1000000` dumps table); `page=999999` huge skip; out-of-range page → 200 empty.
- **Scenario:** An admin deletes an expense record for a genuine audit reason — the row is hard-deleted, violating the audit-immutability rule; the expense simply vanishes from reports. Separately, limit=1000000 dumps the whole table into memory.

## BUG-057 — Backend: dead `RequestType` enum values; refund never updates transaction status
- `schema.prisma:616-622` — `OVERRIDE_DISCOUNT`/`STOCK_OUT_OVERRIDE`/`DELETE_TRANSACTION` have no handlers → `createRequest` 400s; `REFUNDED`/`PARTIALLY_REFUNDED` never set → refunded sales count as revenue (see BUG-017).
- **Scenario:** Staff try to create an OVERRIDE_DISCOUNT approval — it 400s because no handler exists, so the workflow they expected is impossible. And because REFUNDED/PARTIALLY_REFUNDED statuses are never written, monthly revenue reports keep counting refunded sales as income.

## BUG-058 — Backend: exception filter only catches `HttpException` → inconsistent error shape **[LIVE-CONFIRMED ×3]**
- `http-exception.filter.ts:9` — Prisma errors (P2002/P2025), TypeErrors bypass → Nest default `{statusCode,message}` without `details` wrapper → 500 instead of 409; breaks client error parsing.
- **Live proofs:** `GET /approval?status=BOGUS` → 500 bare shape; `PATCH /approval/1/approve` on garbage payload → 500; `POST /customers` with `credit_limit:1e12` (Decimal(10,2) overflow) → **500** — should be a 400 validation error.
- **Scenario:** A forwarder name collision triggers a Prisma P2002 — the exception filter doesn't catch it, so the API returns a bare 500 {statusCode,message} instead of a 409 with details. Monitoring fills with false 500s and clients can't show the real reason.

## BUG-059 — Backend: case-sensitive uniques vs case-insensitive lookups; `contact_number` has no unique constraint
- `schema.prisma` — `username`/`category.name`/`binLocation`/`supplier.name`/`forwarder.company_name` uniques are case-sensitive while services look up `mode:'insensitive'` → "Bolts"/"bolts" coexist, `findFirst` picks arbitrary. `Customer.contact_number` only indexed — DB-level duplicates possible (relies on service check).
- **Scenario:** Two suppliers named 'Bolts' and 'bolts' both get created — the case-sensitive unique allows it while lookups are case-insensitive, so findFirst picks an arbitrary one and PO/report data attaches to the wrong supplier. Customer phone numbers have no unique constraint at all.

## BUG-060 — Backend: system-settings delete can break runtime; no caching; loose boolean parsing
- `system-settings.service.ts:84-95` — ADMIN/MANAGER can `DELETE` operational keys (e.g., `RETURN_WINDOW_DAYS`) → consumers throw mid-transaction. `get*()` hits Postgres every call (hot path). `getBoolean` treats `'TRUE '`/`'yes'` as false.
- **Scenario:** An admin deletes the RETURN_WINDOW_DAYS system setting. The next return request throws mid-transaction. Every getSetting() call also hits Postgres directly — under load, settings lookups add latency to hot paths.

## BUG-061 — Movement "Qty Changed" labels base units with transaction UoM
- `StockMovementHistoryTable.tsx:127-134`; backend stores base units — 2 BOX (factor 12) shows "+24 BOX".
- **Scenario:** A stock audit shows '+24 BOX' for a movement that was actually 2 BOX (factor 12) — the base-unit quantity is labeled with the transaction UoM. Staff investigating shrinkage chase phantom quantities.

## BUG-062 — Staff-name resolution 403s for SECRETARY/STOCK_MANAGEMENT
- `adjustments/page.tsx:270-292`; `GET /staff-users/:id` is ADMIN/MANAGER only → names permanently `Staff #id` for those roles.
- **Scenario:** A secretary reviews stock adjustments and sees 'Staff #7' instead of a name — GET /staff-users/:id is admin/manager-only. The audit trail is unusable for the roles that most need it.

## BUG-063 — Receipt page merges approval quantities in mixed UoM units
- `receipt/[id]/page.tsx:130-140` — base-UoM approval qty added onto sold-UoM display qty.
- **Scenario:** On a receipt for a BOX sale, the refund card adds base-UoM approval quantities onto sold-UoM display quantities — 'returned: 24' when only 2 BOX were involved. Refund validation math is off by the conversion factor.

## BUG-064 — PO line editor rejects fractional qty/factors backend accepts
- `PoLineItemsEditor.tsx:93-108` — integers only; backend allows decimals and factors like 0.001 (G→KG).
- **Scenario:** A buyer needs to order 0.5 BOX or a product measured in KG→G (factor 0.001). The PO line editor's integer-only validation rejects valid decimal quantities the backend accepts — legitimate orders can't be entered.

## BUG-065 — Forwarders search fires per keystroke, no debounce/race guard
- `forwarders/page.tsx:31-74` + `ForwarderFilterBar.tsx:39` — stale out-of-order responses possible (contrast `ProductPicker` 300ms debounce).
- **Scenario:** A user types 'fast' in the forwarder search; responses arrive out of order and a stale result overwrites the fresh one. The table shows forwarders that don't match the query — users pick from wrong data.

## BUG-066 — Approval Requests page swallows load failures; uses `alert()`
- `approval-requests/page.tsx:65-79,131,152` — API failure renders "No approval requests found"; approve/reject failures via blocking `alert()`.
- **Scenario:** The approvals API fails. The page renders 'No approval requests found' — pending refunds look nonexistent, so approvers never act and customers wait indefinitely. Failures surface via blocking alert() dialogs.

## BUG-067 — LoginForm half-authenticated state on session-cookie failure
- `LoginForm.tsx:42-60` — `localStorage` tokens written before `POST /api/auth/session`; cookie failure leaves tokens in localStorage (API works) while proxy bounces all `/dashboard` nav → split-brain auth, no cleanup.
- **Scenario:** The session-cookie POST fails (network blip). localStorage tokens were already written — API calls work, but the proxy bounces every /dashboard navigation to login. The user appears logged out while their session is actually alive — split-brain auth with no cleanup.

## BUG-068 — Backend: analytics correctness — COGS snapshot, sale-vs-stockout, AR drift
- `analytics.service.ts` — line 605 uses current `cost_price` not `TransactionItem` snapshot; "last sale" counts manual stock-outs (`MovementType.OUT` covers both); AR buckets (CreditPayment rows) vs displayed balance (WholeSaleCustomer) diverge under BUG-038/BUG-017.
- **Scenario:** A product's cost changes mid-year. Analytics computes COGS using today's cost_price, not the sale-time snapshot — historical margins shift retroactively. Manual stock-outs count as 'sales' in velocity, and AR aging buckets diverge from displayed balances after the payment races.

## BUG-069 — Backend: wholesale downgrade can orphan AR records
- `customers.service.ts:338-370` — profile deleted when balance=0 & no `CustomerPayment` rows, but refund-settled `CreditPayment` rows can exist → customer vanishes from AR analytics with UNPAID/OVERDUE credits remaining.
- **Scenario:** A wholesale customer settles their balance via refunds only (no CustomerPayment rows). When their balance hits zero the profile is deleted — but UNPAID/OVERDUE CreditPayment rows remain, orphaned from AR analytics. Bad debt becomes invisible.

## BUG-070 — Backend: inactive-user timing side-channel + 403-for-bad-credentials
- `auth.service.ts:42,51` — bad credentials return 403 (should be 401); inactive check skips `argon.verify` → timing distinguishes inactive accounts. No per-account lockout (only global 100/min throttle).
- **Scenario:** An attacker probes usernames — 403-vs-timing reveals which accounts exist and are disabled; with no per-account lockout, credential stuffing is feasible.

## BUG-127 — `POST /returns/refund` & `/returns/exchange` have NO `@Roles` — every authenticated role can file returns
- **Severity:** Medium
- `returns.controller.ts:9-46` — guards present but no `@Roles` on either endpoint; STOCK_MANAGEMENT can create refund/exchange approval requests.
- **Scenario:** A stock clerk files refund approvals for transactions outside their authority — requests enter the approval queue from an unauthorized role.

## BUG-128 — `requestExchange` accepts un-validatable payloads → permanently un-approvable zombie approvals
- **Severity:** Medium
- `returns.service.ts:170-206` — unlike `requestRefund`, zero request-time validation: nonexistent transaction/product → 201 PENDING; approve → handler throws → stuck PENDING forever (BUG-023).
- **Scenario:** A malformed exchange request clogs the approval queue permanently — approvers see a PENDING item that can never succeed.

## BUG-129 — Refund of credit-settled invoices leaves `CreditPayment.status` stale → customer blocked from credit forever
- **Severity:** Medium-High
- `refund-approval.handler.ts:92-111` decrements balances, never updates `status`; overdue checks count `status=OVERDUE` regardless of balance; cron only flips →OVERDUE, never clears.
- **Scenario:** A wholesale customer returns goods on an overdue invoice — refund zeroes the balance but status stays OVERDUE → `hasOverdue:true` forever → every future credit checkout 403s until manual DB fix.

## BUG-130 — `StockMovement.isOverride`/`approvedById` are dead audit fields — overrides never flagged
- **Severity:** Medium
- `schema.prisma:417,427`; `inventory.service.ts:335-350` writes override movements with only a "(OVERRIDDEN)" reason suffix — `isOverride` stays false, `approvedById` has zero writers; filters at `:493-496` can never match.
- **Scenario:** An override sale ships nonexistent stock — the movement log can't be filtered to show who authorized it; shrinkage investigations can't isolate override events.

## BUG-131 — `AdjustInventoryDto.new_count` is `@IsPositive` → physical count of zero cannot be recorded
- **Severity:** Medium
- `adjust-inventory.dto.ts:31-34` — a stocktake finding an empty bin (count=0) → 400; workaround is a manual stock-out producing the wrong movement type.
- **Scenario:** During cycle count a bin is empty — staff can't record count=0 and must fake a stock-out, corrupting the movement-type audit trail.

## BUG-132 — Delivery receiving: duplicate `productId` lines double-restock with stale-WAC
- **Severity:** Medium
- `create-delivery.dto.ts:75-79` (no `@ArrayUnique`); `deliveries.service.ts:105-153,209-256` — duplicate lines each restock; second line's WAC uses the pre-transaction productMap snapshot → wrong cost_price.
- **Scenario:** A receiver lists the same product twice by accident — stock double-counts and weighted-average cost is computed from stale quantities, skewing valuation.

## BUG-133 — `collectWholesalePayment` accepts payments exceeding open invoice sum; excess vanishes at invoice level
- **Severity:** Medium
- `customers.service.ts:461-570` — only ceiling is macro `outstanding_balance`; after FIFO any remainder settles no invoice — money recorded but unapplied, invisible to AR aging.
- **Scenario:** After balance drift (BUG-038/017), a customer pays ₱50k — invoices show less settled; the surplus is untraceable at invoice level.

## BUG-134 — `createCustomer` accepts client-supplied `outstanding_balance` → phantom AR with no invoice
- **Severity:** Medium
- `create-customer.dto.ts:66-75`; `customers.service.ts:98-109` — MANAGER+ can create a WHOLESALE customer already owing ₱50k with zero CreditPayment records.
- **Scenario:** AR aging shows nothing while the customer displays ₱50k owed — bad debt exists with no invoice trail; the credit check uses the inflated balance.

## BUG-135 — `updateCustomer` silently drops wholesale fields on RETAIL customers; blocks ALL edits on wholesale for non-managers
- **Severity:** Medium
- `customers.service.ts:276-293,318-337` — (1) wholesale fields + type=RETAIL → silently ignored, 200 OK; (2) ANY patch on a WHOLESALE customer requires ADMIN/MANAGER/SECRETARY — broader than BUG-034.
- **Scenario:** A cashier fixes a wholesale customer's phone typo → 403 (any edit is manager-gated). A manager edits a retail customer's company_name → 200 but nothing changes — silent data loss.

## BUG-137 — `POST /pos/checkout` accepts CHECK/BANK_TRANSFER but never writes detail rows
- **Severity:** Medium
- `pos.service.ts:329-364` only handles CASH/GCASH/CREDIT; `payment.dto.ts:77-89` discards `details` for CHECK/BANK_TRANSFER — Payment row with no check_number/bank reference.
- **Scenario:** A customer pays by check — the sale records method CHECK but no check number, bank, or clearing status — reconciliation and fraud detection have nothing to audit.

## BUG-152 — Exchange `price_difference` recorded but never collected → revenue leakage on upgrades **[LIVE-CONFIRMED]**
- **Severity:** Medium
- **Locations:** `exchange-approval.handler.ts:91-92,112` — computes `priceDifference` and stores it on the `Exchange` row, but no payment/tender adjustment is created; downgrades likewise never refund the difference
- **Live proof:** Exchange approval #11 swapped ₱80.78 item for ₱116.65 item — `price_difference` ≈ ₱35.87 recorded, APPROVED, no additional charge anywhere. The store gave away ₱35.87 of margin silently.
- **Scenario:** A customer exchanges a ₱80 item for a ₱116 item — the system records the ₱36 difference but never bills it. Every upgrade exchange leaks margin; downgrade exchanges leak cash the other way.
- **Fix:** Create a supplemental payment/charge (or refund) for the difference, or require payment collection at exchange approval.

## BUG-155 — Product creation writes opening stock with no `StockMovement` audit row **[code-verified]**
- `create-product.dto.ts:242-247` accepts `current_quantity`; `products.service.ts:318-339` writes it directly in `product.create`; delete safety (`:630-665`) counts only `stockMovements`, not `current_quantity`.
- **Scenario:** A product is created with 500 units opening stock — inventory shows 500 but the movement log has no IN record (audit gap), and because `stockMovements=0` the product can be hard-deleted while still holding stock, erasing the quantity with zero audit trail.

## BUG-156 — `/transactions` list DTO reads non-existent relation fields → blank/wrong serialized data **[code-verified]**
- `transaction-list-item-response.dto.ts:94-100,136-142` — reads `staff?.name` (StaffUser has `first_name`/`last_name`), `customer.phone ?? customer.number` (Customer has `contact_number`), `forwarder?.name` (Forwarder has `company_name`).
- **Scenario:** `GET /transactions?includeShipments=true` returns every shipment row as "Unknown Forwarder" and blank customer numbers — anyone building reports on the list endpoint gets garbage fields even though the receipt endpoint serializes correctly.

## BUG-157 — Boolean query params treat `"false"` as `true` **[code-verified]**
- `get-staff-users-query.dto.ts:54-60`, `staff-user.service.ts:110-112`, `get-transactions-query.dto.ts:95-120` — `@Type(() => Boolean)` uses JS `Boolean(value)`; the string `"false"` → `true`.
- **Scenario:** Admin requests `GET /staff-users?is_active=false` to list deactivated accounts — gets the *active* ones instead. `includeReturns=false` still pays the extra joins. Filters silently invert.

## BUG-158 — `PATCH /customers/:id` validation gaps: blank strings and unvalidated wholesale values **[code-verified]**
- `update-customer.dto.ts:19-31,41-67` — `name`/`contact_number` only `@IsOptional() @IsString()` (empty strings pass); wholesale validators gated by `o.type === WHOLESALE` so they're skipped when `type` is omitted on an already-wholesale customer — but the service still applies them.
- **Scenario:** PATCH a wholesale customer with `{credit_limit: -500}` and no `type` field — validators skip, service applies → negative credit limit stored. Or `{name: ""}` blanks a required field.

## BUG-159 — Password/credential changes do not revoke existing refresh sessions **[code-verified]**
- `staff-user.service.ts:180-185,199-207` updates password hash with no token invalidation; `auth.service.ts:81-98` refresh only checks user existence + `is_active`.
- **Scenario:** Admin resets a cashier's password after suspected compromise — the attacker's existing refresh token keeps working for days because nothing invalidates sessions on credential change.

## BUG-160 — Mixed retail/wholesale line pricing allowed but line-level type never persisted **[code-verified]**
- `item.dto.ts:43-53` per-item `transaction_type`; `pos.service.ts:72-95,244-289` prices each line by its own type but `transactionItemsData` doesn't store it; `TransactionItem` has no type column.
- **Scenario:** A wholesale checkout mixes a wholesale-priced line and a retail-priced line — both charge correctly, but reports and receipts can't tell which tier each line used; channel analytics are wrong.

## BUG-161 — Wholesale FIFO settlement mishandles negative `CreditPayment` balances **[code-verified]**
- `customers.service.ts:500-549` — FIFO loads credit rows without `remaining_credit_balance > 0`; for a negative `recordBalance`, `remainingToAllocate.gte(recordBalance)` is always true and the remainder *increases*.
- **Scenario:** After BUG-017/149-151 drift leaves a credit row at −₱100, a real ₱50 settlement first "settles" the negative row (remainder grows to ₱150) then marks ₱150 of later invoices paid — ledger shows ₱50 received but ₱150 of invoice balances wiped.

## BUG-162 — Per-line and header totals use different rounding boundaries **[code-verified]**
- `pos.service.ts:267-289,294-306` — line subtotals persist rounded to `Decimal(10,2)` but `grand_total` computes from unrounded accumulators; fractional `quantity_sold` accepted (`item.dto.ts:24-31`).
- **Scenario:** Two lines of 0.5 qty at ₱10.01 each → items sum ₱10.02 but grand_total ₱10.01 — the receipt shows line items totaling more than the total charged; auditors see a ₱0.01 discrepancy on every fractional-qty sale.

## BUG-163 — CASH/GCASH payment `details` optional → payments with zero audit metadata **[code-verified]**
- `payment.dto.ts:75-90` (`details` optional for all methods); `pos.service.ts:335-350` detail rows only created when `details` present; tender/change/GCash reference fields required only *inside* the optional object.
- **Scenario:** A GCash checkout with no `details` succeeds — a ₱5,000 GCash payment is recorded with no reference number or mobile number. Reconciliation can't match it to the GCash statement; fraud is undetectable.

## BUG-166 — Expenses list fetch has no out-of-order response guard **[code-verified]**
- `admin/expenses/page.tsx:70-107` — `loadExpenses` refires on every filter/page change with no sequence counter/AbortController/stale check (contrast shipments `requestId` guard, `useInventory` abort).
- **Scenario:** Admin changes the category filter then quickly the date range — the older request resolves last, leaving the table and pagination showing the stale filter while the UI shows the new one; wrong expense rows until manual refresh.

## BUG-172 — Return window enforced only at request time; approval executes with no re-validation **[code-verified]**
- `returns.service.ts:27-63` window check runs only in `requestRefund`/`requestExchange`; `refund-approval.handler.ts`/`exchange-approval.handler.ts` have no date check — `approveRequest` executes the stored payload whenever clicked.
- **Scenario:** A refund requested on day 6 sits PENDING over a holiday and is approved 3 weeks later — restock + cash payout still execute on a transaction far outside the 7-day policy. `is_within_7_days` is recorded but never enforced.

## BUG-173 — 8 of 9 seeded system settings are dead keys — admin edits have zero runtime effect **[code-verified]**
- Only `RETURN_WINDOW_DAYS` is consumed (`returns.service.ts:37`). `TAX_RATE_PERCENT` (tax hardcoded 0, BUG-074), `RESTOCKING_FEE_PERCENT` (refund breakdown ignores it), `ALLOW_NEGATIVE_INVENTORY` (never read — BUG-125's flag is the only gate), `ENABLE_WHOLESALE_PRICING`, `REQUIRE_RECEIPT_FOR_RETURN`, `STORE_NAME`, `CURRENCY_SYMBOL`, `RECEIPT_FOOTER_MESSAGE` have no consumer.
- **Scenario:** Admin sets `RESTOCKING_FEE_PERCENT=10` expecting refunds to deduct 10%, or disables `ALLOW_NEGATIVE_INVENTORY` expecting stockouts to block — nothing changes. The settings UI promises runtime control that doesn't exist.

## BUG-174 — Refunds/exchanges invisible to all analytics: payment-method breakdown and OpEx never reflect payouts **[code-verified]**
- `analytics.service.ts` never queries `Return`/`Exchange`; refund handlers create no negative `Payment` and no `Expense`. Cash refund payouts never reduce CASH/GCASH tender buckets and never appear in OpEx.
- **Scenario:** ₱50k of cash refunds issued in a month — revenue and the CASH payment-method share are unchanged, OpEx shows nothing; net profit is overstated by the full payout with no report surfacing it.

## BUG-177 — Post-checkout receipt rebuilds line items from the *request* payload, ignoring backend `transaction_items` **[code-verified]**
- `pos-api.ts:383-402` — checkout request sends no price fields; response includes authoritative `transaction_items`, but `receipt.items` is built entirely from the stale cart snapshot (`payload.items`); only totals are read from the response.
- **Scenario:** Another register changes a product's price mid-shift; a cashier completes a sale — `grand_total` charges the server price but every printed line item shows the stale client-side price/name, and lines can fail to sum to the charged total. The printed receipt disagrees with the persisted `TransactionItem` rows and with the same receipt re-fetched later.
- **Fix:** Map `receipt.items` from `tx.transaction_items` (fallback to payload only when absent).

## BUG-178 — `PATCH /products/:id` re-runs duplicate-attribute check even when attributes unchanged → unrelated edits blocked **[LIVE-CONFIRMED]**
- `products.service.ts:500-520` — the fastener-spec duplicate check fires whenever the product *has* specs, regardless of whether the PATCH touches them; frontend `ProductForm` only bypasses via a manual `allowDuplicate` checkbox.
- **Live proof:** `PATCH /products/7600 {base_uom:"BOX"}` → **409 DUPLICATE_PRODUCT_ATTRIBUTES** (identical specs exist on product 5683) — the UoM change was rejected for an unrelated reason; succeeded only with `allowDuplicate:true`.
- **Scenario:** In a catalog with legitimate same-spec products (the CSV seed created thousands), an admin edits a product's price or reorder point — save fails with a duplicate-attributes 409 unless they happen to tick 'allow duplicate', a checkbox meant for creation. Confusing, and the generic error path (BUG-025) hides the real cause.
- **Fix:** Skip the duplicate check when `size_dimensions`/`thread_type`/`material_grade`/`categoryId` are unchanged by the PATCH.

## BUG-180 — No error boundary / not-found / loading / global-error files anywhere in `app/` **[code-verified]**
- Glob for `**/{error,global-error,not-found,loading,default}.tsx` → zero matches.
- **Scenario:** Any render exception — e.g., a malformed API payload reaching `.toFixed()` on `undefined` — unmounts the whole route to Next.js's bare production error screen with no recovery or sign-out path. For non-technical POS staff, one bad payload bricks the till UI until manual reload. Unmatched URLs also get the default 404.
- **Fix:** Add `app/dashboard/error.tsx` (reset + sign-out) and `app/not-found.tsx`.

## BUG-181 — Deliveries and Purchase-Orders list pages fetch with no out-of-order response guard **[code-verified]**
- `deliveries/page.tsx:38-64`, `purchase-orders/page.tsx:50-72` — same unguarded pattern as BUG-166 (expenses); shipments page shows the correct `requestId` guard to copy.
- **Scenario:** User clicks page 2 then quickly page 3 — whichever request resolves last wins; the table can show page-2 rows under a "page 3" indicator until manual refresh. Wrong receiving/PO data shown to staff.

## BUG-182 — Seeded `RETURN_WINDOW_DAYS = "14"` contradicts the strict 7-day return policy **[code-verified]**
- `system-settings.seed.ts:29-34` seeds 14; `returns.service.ts:36-51` consumes it via `getNumber(...,7)` → fresh seeded DBs accept returns for 14 days (+ BUG-040 off-by-one), violating AGENT.md's strict 7-day policy.
- **Scenario:** On a fresh deployment, a customer returns an item on day 10 — accepted, because the seed value overrides the intended 7-day window. Policy enforcement silently depends on whoever last edited the setting.

## BUG-183 — Dependent seeds violate inventory/AR invariants **[code-verified]**
- `transactions.seed.ts` creates CREDIT sales + `CreditPayment` rows without updating `Product.current_quantity`, `WholeSaleCustomer.outstanding_balance`, or movements; `deliveries.seed.ts` inserts rows bypassing `processDelivery` WAC/restock; `stock-movements.seed.ts` reasons reference wrong invoice numbers; `returns-exchanges.seed.ts` creates Return/Exchange rows with no side effects.
- **Scenario:** After mock-mode seeding, `current_quantity` ≠ opening + movements − sales; AR shows credit invoices the customer balance never recorded; analytics/ROP/velocity are wrong on a fresh environment — and anyone debugging 'real' data inherits phantom inconsistencies.

## BUG-184 — `PATCH /products/:id` accepts but silently ignores `current_quantity` **[code-verified]**
- `update-product.dto.ts` inherits `current_quantity` via `PartialType`; `products.service.ts:379-395,565-596` never writes it → 200 with product unchanged.
- **Scenario:** An integration PATCHes `{current_quantity: 999}` to correct stock — gets 200, assumes it worked; stock stays wrong and there's no signal the field was dropped.

---

# LOW SEVERITY

| ID | Location | Issue | Scenario |
|---|---|---|---|
| BUG-071 |`shipments.service.ts:164-193`|Status update outside transaction; concurrent updates interleave| Two staff update the same shipment's status simultaneously. The update runs outside a transaction — interleaved writes can leave the status inconsistent with the audit log. |
| BUG-072 |`inventory.service.ts:445-460`|`getProductsBelowROP` flags zero/negative stock too — verify intended| A product at zero stock appears in below-ROP reports alongside genuinely low items — ROP alerts lose meaning and staff waste time on already-empty bins. |
| BUG-073 |`deliveries.service.ts:233-235`|WAC float math + mid-calc `toFixed(2)` vs `Prisma.Decimal`| Over hundreds of deliveries, WAC float math and mid-calculation toFixed(2) drift from Prisma.Decimal precision — inventory valuation is off by cents that compound into real discrepancies at audit time. |
| BUG-074 |`pos.service.ts:294`|`tax_total` hardcoded 0 — confirm tax out of scope| If the business ever operates in a tax jurisdiction, every receipt shows tax_total=0 — confirm tax is genuinely out of scope before go-live or receipts are legally wrong. |
| BUG-075 |`pos.service.ts:226-233`|Unconfigured `current_uom` silently uses factor=1 (late rollback via UOMMismatch)| A product's current_uom is misconfigured. The system silently uses conversion factor=1 instead of failing fast — stock and pricing are wrong until a much later UOMMismatch rollback, by which time transactions already committed. |
| BUG-076 |`customers.service.ts:78-89`|Duplicate contact check not transactional; DB has no unique constraint (see BUG-059)| Two cashiers create customers with the same phone number simultaneously. The duplicate check isn't transactional and there's no DB unique constraint — both succeed, splitting the customer's history and credit profile. |
| BUG-077 |`returns.service.ts:99-114`|Cash refund payout not capped by non-credit tender actually paid (`originalPayments` unused)| A sale paid half cash/half credit is refunded. The cash payout isn't capped by the cash actually tendered (originalPayments unused) — the store hands out more cash than it took in. |
| BUG-078 |`ShipmentTable.tsx:140-142` + `shipments.service.ts:133-142`|"Dispatched" column shows creation timestamp; `dispatch_date` never set on create/update| Ops reviews shipment dispatch times. The 'Dispatched' column shows the record's creation timestamp because dispatch_date is never set — SLA and carrier-performance reports are wrong. |
| BUG-079 |`SupplierTable.tsx:81-105`|Supplier search no debounce + no race guard| A user types in the supplier search; out-of-order responses leave stale rows. They edit or order from the wrong supplier record. |
| BUG-080 |`SupplierTable.tsx:127-147`|Delete on last page → empty page, no clamp| A manager deletes the last supplier on page 3. The table reloads the same page — now empty — with no step-back, looking like a bug. |
| BUG-081 |`AddStaffModal.tsx:252-274`|"Account Status" toggle in create mode; `is_active` silently dropped| An admin creates a staff account with 'Account Status' toggled off, believing the account is inactive. is_active is never sent on create — the account is active anyway. A 'disabled' employee can still log in. |
| BUG-082 |`EditROPModal.tsx:40-43`|ROP integers only; backend allows 3-decimal| A planner wants reorder point 10.5 units. The ROP editor only accepts integers though the backend allows 3 decimals — precise reorder points can't be configured. |
| BUG-083 |`inventory/page.tsx:47-55`|Low-stock tabs filter current page only; counts misleading| A staff member clicks the 'Low Stock' tab and sees 3 items — assumes stock is fine. Items below ROP on other pages never appear; the store stockouts on products the tab claimed were healthy. |
| BUG-084 |`BinAssignmentModal.tsx:80-107`|Bin picker page-1-only (20 bins); search mitigates| With >20 bins, the assignment picker's first page misses the correct bin. Products get assigned to wrong bins 'because it was the only option visible' — pickers degrade over time. |
| BUG-085 |`bins/page.tsx:79-87`|Page change can apply unsubmitted search text| A user types a bin search but doesn't press enter, then clicks page 2. The fetch uses the unsubmitted text — results are filtered by something the user can't see in the UI. |
| BUG-086 |`use-pos-cart.ts:245-276`|`updateItemUom` never wired — can't change UoM in cart| A wholesale customer wants to buy by the BOX but the cart can't switch UoM — updateItemUom exists but is never wired to the UI. Cashiers do manual quantity math, producing wrong totals and disputes. |
| BUG-087 |`pos-api.ts:60-65`|First non-base UoM picked as `pricing_uom`; `is_default_sales` ignored; extra UoMs unreachable. `BackendProductUom` (`pos-types.ts:47-57`) also missing `cost_price`, `calculated_cost_price`, `is_default_purchase`, `is_default_sales` the backend returns — cost-side data invisible to POS pricing| A product's designated default sales UoM is ignored — the first non-base UoM is picked instead, and cost-side UoM fields aren't even typed. POS prices can quote the wrong unit entirely. |
| BUG-088 |`CreditPaymentForm.tsx` ~153|Credit always full balance — no partial splits; `poNumber` collected but dropped. `submitCheckout` emits only `{date}` for CREDIT `details`; `po_number`/`credit_due_date` in `CheckoutPaymentEntry` silently discarded (backend `CreditDetailsDto` accepts only `date` anyway)| A wholesale customer gives a PO number at checkout. It's collected in the form but dropped before submit — AR records lack the reference needed to reconcile against the customer's own PO system. |
| BUG-089 |`pos-api.ts:229-238`|Dummy fallback `product_id:1` if checkout with empty cart (unreachable but fragile)| If checkout is ever invoked with an empty cart (keyboard shortcut, race), the payload emits product_id:1 — a phantom line item for an unrelated product could be committed. |
| BUG-090 |`pos-types.ts:10-19`|`UnitOfMeasure` missing `SACK`; `PaymentMethod` missing `CHECK`/`BANK_TRANSFER` (spec includes Bank Transfer)| A product uses SACK as base UoM — the POS UnitOfMeasure type doesn't include it, and PaymentMethod lacks CHECK/BANK_TRANSFER though the spec requires bank transfer. Type-level drift means those flows can't be built without fixes. |
| BUG-091 |`approval-api.ts:22-25`|Unpaginated `/approval` fetch per receipt view| Every receipt view fetches the entire unpaginated /approval list. As approval volume grows, opening a receipt gets progressively slower — an N+1-style perf leak on a hot path. |
| BUG-092 |`pos-api.ts:556-561`|Receipt invoice lookup uses default `limit=10`| A customer returns an older invoice. The receipt lookup uses the default limit=10 — matches beyond the first page are missed and the receipt shows 'not found' for a real transaction. |
| BUG-093 |`AddCustomerModal.tsx:82-87,44-58`|`credit_limit` unbounded (Decimal(10,2) overflow) + `NaN` passes `<1` check; add-mode modal never resets state between opens| An admin enters credit_limit 99999999999 — exceeds Decimal(10,2), the save 500s. Entering 'abc' passes the <1 check as NaN. And because the add-mode modal never resets, the next customer opened inherits the previous customer's credit limit — wrong limits saved silently. |
| BUG-094 |`use-pos-catalog.ts`|Category failure → names silently "General"| The categories endpoint fails during a busy period. Every product silently degrades to categoryName 'General' — the catalog looks miscategorized and category filters return wrong groupings with no error shown. |
| BUG-095 |`pos/page.tsx:19-79`|`MOCK_SWAGGER_RECEIPT` 60-line dead mock| MOCK_SWAGGER_RECEIPT — 60 lines of dead mock receipt data sit in pos/page.tsx. Devs copy-paste from it or wonder if it's live; it's bundle noise and a maintenance trap. |
| BUG-096 |`lib/api.ts:155-158`|Refresh failure rejects with refresh error, not original| A request fails AND the refresh fails. The user sees the refresh error instead of the real error — debugging and support get misleading information. |
| BUG-097 |`LoginForm.tsx:17,60`|Open redirect via `?redirect=` (external URL not validated); proxy drops attempted path| An attacker sends a cashier a link /auth/login?redirect=https://evil.example. After login the app navigates to the external site — credential-phishing-adjacent open redirect. The proxy also drops the originally attempted path. |
| BUG-098 |`use-current-role.ts:26-28`|Dev fallback grants ADMIN UI on `/api/auth/me` failure — masks gating gaps| In dev/staging, /api/auth/me fails transiently. The role hook falls back to ADMIN — the UI shows every admin button; every click 403s. Masking real gating gaps makes permission bugs harder to spot. |
| BUG-099 |Currency formatting|`formatPeso` vs `` `₱${toFixed(2)}` `` (ungrouped, `₱NaN`) vs `toLocaleString` mixes| A receipt shows ₱1,234.00 in one place and ₱1234.00 in another; a bad value renders ₱NaN. Customers and auditors see inconsistent, unprofessional amounts across the app. |
| BUG-100 |`lib/api.ts:5`|Missing `NEXT_PUBLIC_API_BASE_URL` → relative URLs → confusing 404s| A deployment forgets NEXT_PUBLIC_API_BASE_URL. All API calls resolve relative to the frontend origin — every request 404s and the failure mode ('cannot GET /products' on :3000) is confusing to diagnose. |
| BUG-101 |`app/api/auth/session/route.ts`, `me/route.ts`|Session route stores any posted token unvalidated; cookie `secure` flag opt-in; `maxAge` hardcoded 24h; proxy/me decode JWT without verification (UI-gating only, real authz still Bearer)| On plain-HTTP LAN deployments (COOKIE_SECURE unset), the access_token cookie travels without Secure. Any script can also POST an arbitrary token into the session cookie — it 401s downstream, but the unvalidated write is a footgun if backend validation ever weakens. |
| BUG-102 |`forwarders/types.ts:2`|`Forwarder.id: string` but API returns `number`| Forwarder.id is typed string but the API returns number. Code doing === comparisons, sorting, or Math operations on ids behaves subtly wrong — a latent correctness trap. |
| BUG-103 |`forwarders/page.tsx:127-132`|Delete last item on page >1 → empty page, no step-back| A user deletes the last forwarder on page 2. The list reloads the same now-empty page — same dead-end confusion as BUG-080. |
| BUG-104 |`EditROPModal.tsx:28`|State initialized once; stale if `item` prop changes without remount (currently safe via conditional mount — fragile contract)| EditROPModal initializes state once from props. Today the parent remounts it correctly, but any future caller that reuses the component without a key will show the previous item's ROP — an editor saves the wrong reorder point. |
| BUG-105 |`StockMovementModal.tsx:184-186`|Stock-out check doesn't round converted qty — epsilon disagreement with preview| A product with a fractional UoM factor (KG↔G): the negative-stock preview rounds the converted qty but the submit guard doesn't — the UI can block a sale the preview allowed (or warn while the guard passes). Cashiers hit unexplained validation walls at the counter. |
| BUG-106 |`app/dashboard/admin/`|No index `page.tsx` → direct `/dashboard/admin` 404s| A manager navigates to /dashboard/admin expecting an admin landing page — 404. Dead end; there's no index route. |
| BUG-107 |`app/page.tsx`, `dashboard/page.tsx:43-174`|create-next-app boilerplate + ~130 lines commented-out dashboard UI| create-next-app boilerplate and ~130 lines of commented-out dashboard code ship in production bundles — maintenance noise and confusion about what's actually live. |
| BUG-108 |Backend schema indexes|Missing FK indexes: `Payment.transactionId`, `Return.*`, `Exchange.*`, `CustomerPayment.staffId`, `StockMovement.staffId/approvedById`, `PurchaseOrder.staffId`, `Expense.staffId/payment_method`; **`ApprovalRequest` has zero indexes** (filters+sort → seq scan); `Transaction.status/type` unindexed; redundant indexes on Forwarder/Supplier/WholeSaleCustomer| At scale, the approval list and payment/return joins seq-scan (ApprovalRequest has zero indexes; Payment.transactionId, Return.*, Exchange.* unindexed). Receipt views and approval queues degrade as transaction volume grows. |
| BUG-109 |`schema.prisma` misc|`Shipment.tracking_number` not unique; `BinLocation` lacks zone field + no update/delete endpoints; `Payment`/`TransactionItem`/`CustomerPayment` cascade deletes would wipe audit data if ever triggered; `ExpenseResponseDto.amount` Decimal→number vs other endpoints possibly string — inconsistent numeric typing| Two shipments can share a tracking_number — carrier lookups become ambiguous. If a cascade delete is ever triggered on Payment/TransactionItem/CustomerPayment, the audit trail is wiped. Expense amount typing (Decimal→number vs string elsewhere) causes parse inconsistencies. |
| BUG-110 |`main.ts:20-29`|CORS origins hardcoded to 4 LAN IPs — DHCP changes break frontend; consider env-driven list| The office router renews DHCP and the server's LAN IP changes. The hardcoded CORS list no longer matches — the frontend is blocked entirely until someone edits main.ts and restarts the API. |
| BUG-111 |`approval.controller.ts:78-79`|`status`/`type` query params unvalidated → invalid enum → Prisma validation error → 500 (not 400) via BUG-058| A user or script passes an invalid status/type filter to /approval — instead of a clean 400, Prisma throws and the API returns 500. Monitoring sees false server errors and clients can't distinguish bad input from outages. |
| BUG-112 |`credit-status-task.service.ts`|Daily cron, no distributed lock, errors swallowed to logs; never re-evaluates OVERDUE→PAID (handled by payment flow — OK)| Two backend instances (or a restart mid-run) execute the daily credit-status cron without a distributed lock — OVERDUE markings can double-apply or interleave. Errors are swallowed to logs, so stale credit statuses persist silently. |
| BUG-136 |`get-suppliers.dto.ts:35-40`, `get-customer.dto.ts:62-71`|Unbounded `limit` (no `@Max`) on suppliers/customers — same class as BUG-056| Someone requests /suppliers?limit=1000000 — the API dumps the entire table in one response, and a script or bug loops this to hammer the DB. |
| BUG-138 |`inventory.service.ts:293-299`|`needsRecount` flag set inside rolled-back transaction never persists| A product repeatedly fails stock checks — the recount flag is set then rolled back with the failed checkout, so it's never marked. Staff never know which products need physical recounts. |
| BUG-139 |`inventory.service.ts:409-439`|`assignBin` catches P2002 only — missing product throws P2025 → 500 not 404| PATCH /inventory/:id/bin with a deleted product ID → 500 instead of a clean 404. Frontend shows 'server error' instead of 'product not found'. |
| BUG-140 |`stock-out.dto.ts:20-23`, `inventory.service.ts:339`|`date` accepted in stock-out DTO but silently ignored — movement always stamped now| Stock-in and adjust honor backdating; stock-out doesn't. A manager backdating a stock-out for last week's audit gets today's timestamp — the movement history doesn't match reality. |
| BUG-141 |`forwarder.service.ts:94` + paginated response DTOs (`paginated-products-response.dto.ts:36`, `paginated-transactions-response.dto.ts:24`, `paginated-staff-users-response.dto.ts:24`, `paginated-stock-movements-response.dto.ts:40`, `paginated-bin-locations-response.dto.ts:24`)|`totalPages: 0` on empty results — NOT just forwarders; most paginated endpoints share the defect| Any paginated list returns empty — products search with no match, empty transactions/staff/movements/bins/forwarders — and a consumer computes totalPages=0: pagination UI shows 'Page 1 of 0' or div-by-zero instead of the standard totalPages>=1 envelope. |
| BUG-142 |`get-shipments-query.dto.ts:34-40`, `shipments.service.ts:232-338`|`status` query param accepted but silently ignored by both list endpoints| Caller requests /shipments/active?status=DELIVERED — validation passes, but the service hardcodes its own status split, so the caller gets the wrong dataset with a 200 and no warning. |
| BUG-143 |`system-settings.controller.ts:47,57`|Settings GET endpoints have no `@Roles` — any authenticated user reads all operational config| A cashier reads RETURN_WINDOW_DAYS, credit thresholds, and any future secrets-in-settings — today it's probably fine, but there's no key allowlist so a sensitive key added later is exposed by default. |
| BUG-144 |`schema.prisma:228`, `shipments.service.ts:186-193`|`Shipment.dispatch_date` set at creation, never updated on DISPATCHED transition| Ops sorts active deliveries by dispatch_date expecting actual dispatch times — they get creation order instead, so the oldest-created (not oldest-dispatched) shipments surface first. |
| BUG-145 |`products.service.ts:301-316,537-562`, `create-product-uom.dto.ts:18-19`|`ProductUom` can duplicate `base_uom`; multiple `is_default_*` flags allowed| A product gets a ProductUom row equal to its base_uom — dead weight that can shadow/confuse UoM pickers. Multiple rows can claim default sales/purchase simultaneously, and nothing enforces a single default. |
| BUG-146 |`products.service.ts:139`|Auto-SKU suffix is only last-4-digits of `Date.now()` → same-ms collisions hard-fail| Two products created in the same millisecond with identical attributes get identical SKUs — the second create throws DuplicateProductException. Rare but real during bulk imports. |
| BUG-147 |`schema.prisma:655-661`, `shipments.service.ts:83`|`TransactionStatus.CANCELLED`/`REFUNDED`/`PARTIALLY_REFUNDED` are dead — nothing ever sets them| Returns can be filed against any transaction regardless of status because no transaction ever leaves COMPLETED — a 'cancelled' or fully-refunded sale still accepts new return requests. |
| BUG-148 |`customers.service.ts:679-691`|`updateOverduePaymentsStatus` marks zero-balance credit records OVERDUE — no balance predicate| A credit row driven to ~0 balance without a status update (BUG-129 drift) gets flipped to OVERDUE by the cron anyway — the customer is blocked from credit checkout over an invoice they already paid off. |
| BUG-164 |`checkout.dto.ts:18-26`, `pos.service.ts:62-67,380-394`|Checkout `customerId` lacks `@IsInt()`; nonexistent IDs pass validation then fail on FK as 500| A script or buggy client sends customerId:999999 — validation passes (positive number), customer lookup misses, and the transaction insert dies on the FK constraint as a 500 instead of a clean 400/404. |
| BUG-167 |`receipt/[id]/page.tsx:324,356-358`, `ReceiptModal.tsx:105-107`, `PrintableInvoice.tsx:131`|Up to three elements share `id="printable-receipt"` on the receipt page| Three DOM nodes carry the same print ID — invalid HTML, and `@media print` positions all of them at identical coordinates. Today content coincides so output looks right, but any divergence (modal showing a different receipt, returns variant) prints overlapping garbage. |
| BUG-168 |`EditExpenseModal.tsx:64-66`|Edit Expense cannot clear an existing date — falsy check skips the change| An expense saved with a date is opened in Edit, the date field cleared (marked optional), saved — `values.date === ""` is falsy so the PATCH never includes `date`; the stored date silently remains while the UI implies it was cleared. |
| BUG-169 |`GCashPaymentForm.tsx:41,132-139`|`+639…` format unreachable — input strips `+` and `maxLength=11` truncates `639XXXXXXXXX`| Customer reads their GCash number as "+639 17 123 4567"; cashier types it — `+` stripped, truncated to 11 digits, fails `mobileRegex` forever. The `+639` branch is dead code; users only learn the real format from a failed submit. |
| BUG-170 |`StaffTable.tsx:162,518-550`|Client-side pagination never clamps `page` when `filteredStaff` shrinks on refetch| On page 2+ with an active filter, enough rows leave the set after a refetch that the page empties — pagination hides entirely (≤LIMIT) and the table shows 'No staff members match' with no Previous button. Dead end until the user guesses to change a filter. |
| BUG-175 |`inventory.service.ts:206,340`; `analytics.service.ts:572-579,638-641`; `schema.prisma:691-695`|`MovementType.SALE`/`RETURN` never written — sales, exchange issues, and return restocks all log as generic IN/OUT| A product issued only via exchanges shows a fresh 'last sale' date with zero sales volume — velocity reports it as recently sold while it's actually dead stock. Auditors can't distinguish a return restock from a supplier stock-in except by parsing reason strings. |
| BUG-176 |`deliveries.service.ts:217-220,122-136,157-179,233-241`|WAC intake cost uses the PO's conversion factor, not the delivered UoM's; `productMap` snapshot read before `$transaction`| PO ordered in BOX (factor 12) but received in pieces — stock adds base units correctly while `cost_price` WAC divides by the PO's factor, silently skewing valuation; concurrent sales make the WAC denominator stale too. |
| BUG-185 |`create-po-item.dto.ts:5-8`, `get-products.dto.ts:18-21`, `stock-in/out.dto.ts:15-18`, `adjust-inventory.dto.ts:15-18`, `assign-bin.dto.ts:5-8`|Multiple DTOs use `@IsNumber()`/`@IsPositive()` without `@IsInt()` on ID fields — fractional IDs reach Prisma Int columns as 500s| `POST /inventory/stock-in {"productId":1.5}` or `PATCH /inventory/:id/bin {"binId":1.5}` passes validation then dies inside Prisma as a 500 instead of a clean 400 — same class as BUG-164 but across five more endpoints. |
| BUG-186 |`create-customer-payment.dto.ts:12-15,29-36`; `customers.service.ts:451-455,552-562`|Settlement DTO declares `SettlementPaymentMethod = CASH\|GCASH` but validates the broader `PaymentMethod` enum — CHECK/BANK_TRANSFER accepted with no reference required| `POST /customers/wholesale/:id/payments {payment_method:"CHECK"}` succeeds, decrements AR, and settles FIFO invoices with no check number or bank detail — bypasses the intended settlement contract and its audit trail. |
| BUG-188 |`bin-location.service.ts:52-54,90-92` (+ log sites in staff-user/product-categories services)|User-facing errors contain literal template syntax — `\(aisle_number}` / `\)shelf_location}` instead of interpolated values| Creating a duplicate bin returns a 409 whose message shows broken template text instead of which aisle/shelf conflicted — users can't tell what went wrong; same malformed strings appear in logs. |
| BUG-189 |`prisma/seeds/admin.seed.ts:6-9`, `staff.seed.ts:6-29`|Seeds create known-credential ADMIN/MANAGER/CASHIER/STOCK accounts (`admin123`/`staff123456`)| If `prisma/seed.ts` ever runs against staging/production, well-known credentials immediately grant ADMIN and MANAGER access — conditional on seed misuse outside local dev. |
| BUG-190 |`lib/inventory/useROPItems.ts:48-69`|ROP hook refetches from 3 concurrent sources (mount, window focus, 30s interval) with no sequencing or unmount guard| An older slower `/products?limit=100` response resolves after a newer one and overwrites fresher ROP rows; `setResult` can also fire after unmount. Compounds BUG-001's truncated data with staleness. |
| BUG-191 |`lib/inventory/shipment-utils.ts:43-58`|`splitShipmentNotes` reclassifies any user text matching the log-line regex as system log| A note containing a line like `[2026-01-01 Status -> DELIVERED]:` (pasted correspondence, seeded data, format change) causes all subsequent real notes to be hidden inside parsed log entries — the drawer shows truncated user text. |

## BUG-113 — Roles without POS access get infinite redirect loop — app unusable **[BROWSER-CONFIRMED]**
- **Severity:** High
- **Locations:** `app/dashboard/page.tsx:42` (unconditional `redirect("/dashboard/pos")`), `proxy.ts:58-59` + `lib/auth/roles.ts:25` (`/dashboard/pos` = ADMIN/MANAGER/CASHIER only)
- **What:** `/dashboard` always redirects to `/dashboard/pos`. For STOCK_MANAGEMENT, SECRETARY, and SALES_CLERK the proxy then bounces `/dashboard/pos` → `/dashboard` → `/dashboard/pos` → … `ERR_TOO_MANY_REDIRECTS`. **Live proof:** confirmed for all three roles — `stock_alex`, `test_secretary`, `test_sales_clerk` each landed on `/dashboard` then redirect-looped on every route.
- **Impact:** Three of six roles cannot use the application at all via normal navigation (direct URLs to permitted pages like `/dashboard/inventory` still work, but login lands in the loop).
- **Fix:** Make `/dashboard` role-aware (redirect to first permitted route per role) or remove the hard redirect.
- **Scenario:** A secretary logs in — lands on /dashboard, which redirects to /dashboard/pos, which the proxy bounces back. Infinite redirect: the app is completely unusable for STOCK_MANAGEMENT, SECRETARY, and SALES_CLERK — proven live for all three roles.

## BUG-114 — ROP page's `/products` fetch accidentally masks the `/inventory/rop` 403 for CASHIER/SALES_CLERK
- **Severity:** Low (observation)
- BUG-001's client-side `/products?limit=100` call is role-allowed, so cashier sees a "working" ROP page (with wrong/incomplete data anyway) instead of the 403 the dedicated endpoint would return. Fixing BUG-001 will surface BUG-044's ROP role mismatch — fix both together.

---
- **Scenario:** Fixing BUG-001 properly (calling /inventory/rop) exposes that CASHIER/SALES_CLERK get 403 from that endpoint — the ROP page breaks for them the moment the real fix ships. The two bugs must be fixed together.

# ADDITIONAL FINDINGS

BUG-115–121 continue the register numbering.

## BUG-115 — Products page has no role gating on create/edit/delete **[code-verified]**
- **Severity:** Medium
- `ProductTable.tsx` renders Add/Edit/Delete for all roles; backend `products.controller.ts` restricts POST/PATCH to ADMIN/MANAGER/SECRETARY and DELETE to ADMIN/MANAGER. CASHIER/SALES_CLERK see controls that always 403; SECRETARY can edit but not delete with no UI distinction. `roles.ts` grants `/dashboard/products` to all six roles. Companion to BUG-044 — apply the `permissions.ts` pattern.
- **Scenario:** A cashier opens the Products page and sees Add/Edit/Delete buttons. Every mutation 403s (backend restricts writes to ADMIN/MANAGER/SECRETARY). A secretary can edit but not delete — with no UI distinction, users learn permissions by failure.

## BUG-116 — `fetchActiveForwarders` truncates at 100 **[code-verified]**
- **Severity:** Medium (latent)
- `shipment-api.ts:89-94` — `GET /forwarders?is_active=true&limit=100` once; >100 active forwarders silently missing from the shipment modal's forwarder picker. Same latent class as BUG-030.
- **Scenario:** The forwarder master grows past 100 active records. Forwarders beyond the cap never appear in the shipment modal's picker — shipments can't be logged for them and there's no indication why.

## BUG-117 — `next.config.ts` `allowedDevOrigins` hardcodes a single LAN IP
- **Severity:** Low (dev-only)
- `allowedDevOrigins: ["10.42.0.1"]` — breaks dev access from any other host/IP (other dev machines, Tauri devtools, different LAN). Also a leftover commented duplicate config block. Consider env-driven or omitting.
- **Scenario:** A teammate pulls the repo on a different machine or accesses the dev server from another LAN IP — allowedDevOrigins only lists 10.42.0.1, so dev requests are blocked. Tauri devtools hit the same wall.

## BUG-118 — `ProductForm` silently coerces invalid `cost_price` to `0`
- **Severity:** Low
- Non-numeric input → `NaN` → sent as `0` instead of a validation error (backend `cost_price` optional). Same NaN-vs-undefined inconsistency between create (omits) and edit (sends `null`).
- **Scenario:** A staff member types an invalid cost price — NaN is silently sent as 0. The product saves with zero cost, corrupting margin and COGS analytics with no error shown.

## BUG-119 — `ProductTable` duplicate `useEffect` resetting page
- **Severity:** Low (cosmetic)
- `ProductTable.tsx:93-99` — identical `setPage(1)` effect declared twice on the same deps. Harmless but sloppy.
- **Scenario:** No user-facing scenario — the duplicate effect just runs setPage(1) twice. Code hygiene only; the risk is confusing future editors.

## BUG-120 — `pos/page.tsx` hold-transaction `alert()` placeholders
- **Severity:** Low
- `alert("Hold function activated")` stubs remain for hold shortcuts — dead UI affordance presented to cashiers.
- **Scenario:** A cashier hits the hold-transaction shortcut expecting a real feature — an alert() popup appears instead. Dead UI affordance that looks broken and can't be used.

## BUG-121 — Modal state-init fragility in `SettingFormDialog` / `AddStaffModal`
- **Severity:** Low
- `useState` initialized once from props; currently safe only because parents key-remount (`key={formSession}`, `key={edit-${id}}`). Any future caller that doesn't will show stale values when switching records. Document or reset-on-open.
- **Scenario:** A future developer reuses SettingFormDialog/AddStaffModal without the key-remount pattern. Switching between records shows the previous record's values — an admin edits and saves stale data onto the wrong entity.

## BUG-123 — Adjustments page: zero-match attribute filters produce phantom pagination
- **Severity:** Low-Medium
- `adjustments/page.tsx:213-267` — when size/thread/material/category filters match **no** products, `fetchMatchingProductIds` returns an empty set; the code still fetches `/inventory/movements` **without** `productId` (only sent when exactly 1 match), so the server returns the unfiltered total. Client then filters the 20-row page to 0 rows → "Total records: N" and page count reflect invisible data; pagination walks an unseen dataset. Companion to BUG-026.
- **Scenario:** An auditor filters adjustments by a size no product has. The table shows 0 rows but 'Total records: 500' and phantom pages — staff think data is missing or the filter is broken, and pagination walks an invisible dataset.

## BUG-124 — Dead `AdjustmentForm` inside `StockMovementModal.tsx` contains latent bugs
- **Severity:** Low (dead code / maintenance trap)
- `components/inventory/StockMovementModal.tsx:41-141` — an entire unused `AdjustmentForm` component: sets a fake "adjusted successfully" banner on item select (before any save), sends `reason: ""` which violates `AdjustInventoryDto @IsNotEmpty` → guaranteed 400, and lacks the validation the live `StockAdjustmentModal` has. Delete it or fix before reuse.
- **Scenario:** A developer wires up the dead AdjustmentForm thinking it's the real adjust flow. It shows a fake success banner before saving, sends reason:'' which the backend rejects with 400, and lacks required-field validation — guaranteed-confusing UX if ever shipped.

## BUG-122 — Bins page keeps stale `searchQuery` **and** stale `page` after exact lookup
- **Severity:** Low
- `bins/page.tsx` — after an exact-location lookup replaces results with one row, `searchQuery` retains old text AND `page` state stays >1 while `meta` is overwritten to page 1. A subsequent page change refetches with the stale filter/page → mixed state (filtered list under exact-lookup UI). `AddBinModal` also rendered ungated (backend POST requires ADMIN/MANAGER/SECRETARY → CASHIER/STOCK_MANAGEMENT 403 — part of BUG-044).
- **Scenario:** A user runs an exact bin lookup from page 3 — one row shows, footer says 'Page 1 of 1', but internal page state stays 3. Clicking Prev silently reloads a filtered list under the exact-lookup UI — mixed state leads to editing the wrong bin.

---

# INFORMATIONAL / OBSERVATIONS

## OBS-001 — Backend rejects unknown query params with 400 **[LIVE-CONFIRMED]**
`forbidNonWhitelisted` → `GET /products?bogus_param=1` → 400. Also: `POST` on `@Idempotent` endpoints **requires** `Idempotency-Key` header (400 "Header Idempotency-Key is required" — verified). Out-of-range pages → 200 + empty `data`.
- **Scenario:** Contract note, not a bug: any frontend param outside the DTO whitelist gets a 400 (verified), and @Idempotent POSTs hard-require the Idempotency-Key header — integrations must send it or every mutation fails.

## OBS-002 — Analytics AR endpoint has no date filters
Only `limit` accepted — AR tab point-in-time (documented in PR #61).
- **Scenario:** The AR aging report is always point-in-time — you can't answer 'what did AR look like last month-end' for trending or audit comparisons.

## OBS-003 — Backend dev startup required `npm install`
`csv-parse` declared but missing → `TS2307` on seeds. Use `npm ci` fresh.
- **Scenario:** A new dev clones the repo and runs the seed — it crashes on missing csv-parse (declared but not installed in node_modules). Fresh setups need npm install before seeding works.

## OBS-004 — No `GET /returns` endpoint
Only `POST /returns/refund` + `POST /returns/exchange`; receipt history reconstructed from `/approval` (fragile — BUG-045/063).
- **Scenario:** There's no GET /returns endpoint — return history must be reconstructed from the approvals list, which is why BUG-045/063 exist. Any consumer needing a returns ledger has no authoritative source.

## OBS-005 — `/api/auth/session` + proxy trust unverified JWT claims for UI gating
Real API authz uses the Bearer token (unforgeable); cookie role only drives nav visibility. Latent footgun (BUG-101).
- **Scenario:** The session cookie's role claim is decoded, not verified — fine today because real authz uses the Bearer token, but if backend validation is ever weakened or a route trusts the cookie, the UI gating becomes the only (cosmetic) barrier.

## OBS-006 — Cascade-delete audit: payment-side relations cascade, delete endpoints absent (latent)
- `Payment`, `TransactionItem`, `CashPayment`/`GCashPayment`/`CheckPayment`/`BankTransferPayment`/`CreditPayment`, `DeliveryItem`, `ProductUom` all `onDelete: Cascade` with parents (`schema.prisma:73-183,395,533`). Safe today only because no delete endpoint exists for Transaction/Delivery/Product-with-history — but `DELETE_TRANSACTION` exists in the RequestType enum, so a future delete feature would wipe the entire payment + item audit trail in one cascade (violates the AGENT.md audit-immutability rule). Conversely `Return`/`Exchange`/`Shipment` relations default to Restrict (safe), and `Transaction.customerId`/`staffId` are Restrict — inconsistent. Also: `WholeSaleCustomer.customer → Cascade` means deleting a Customer cascades the wholesale profile → cascades all `CustomerPayment` ledger rows; `updateCustomer`'s wholesale-profile delete guard (`customerPayment.count` check) is not transactional with the delete — a payment recorded between check and delete is cascade-wiped.
- **Scenario:** A future 'delete transaction' admin feature ships without touching the schema — one click erases the transaction's payments, items, and credit records. The audit ledger the business relies on for disputes and tax compliance is gone, unrecoverable.
- **Fix (preemptive):** flip payment-side cascades to `Restrict`/`NoAction` before any delete feature is added; wrap the wholesale-profile count-check + delete in a transaction.

## OBS-007 — Minor code hygiene (pass-3 parsing audit)
- `PrintableInvoice.tsx:33-39` — `formatQuantity` dead conditional (both branches return `String(quantity)`).
- `use-pos-catalog.ts:22-24,42-44` — duplicate `setError` calls per failure (first is dead).
- `pos-api.ts:510-516` — `TransactionSummary.paymentMethod` union omits `CHECK`/`BANK_TRANSFER`; `getBadgeVariant` (`receipt/page.tsx:91-104`) has no case for them — type lies, badge falls through to default.
- **Scenario:** A CHECK/BANK_TRANSFER payment renders with a generic badge and no dedicated styling — cosmetic today, but the type gap means a future switch on paymentMethod silently misses those methods.

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
| PO intake flow | Full receive auto-transitions PO to FULFILLED; deliveries on FULFILLED PO rejected 400 |
| Shipment lifecycle | `PENDING→DELIVERED` skip rejected 400; `DELIVERED→*` terminal rejected 400; dup active shipment 409 |
| Settlement overpayment | `amount_paid` > balance → 400 (backend rejects; modal caps client-side anyway) |
| Overdue-invoice checkout block | CREDIT checkout on customer with overdue invoice → 403 with clear message; `override:true` bypasses as designed |
| Fuzz sweep (34 probes) | Negative/zero/huge quantities, bogus enums/UoMs/products, extra fields, empty payloads → all clean 400/404/409 (one Decimal-overflow 500 = BUG-058) |
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
