# Inventory tests (Playwright)

Tests for the Inventory menu (Inventory, Adjustments, Bin Locations) and the related
Purchase Orders, Receive Deliveries and Outgoing Shipments pages.

## Before you run them

1. Backend running: `npm run start:dev` in `soft-eng-pos-api` (port 3001)
2. Frontend running: `npm run dev` in `soft-eng-pos` (port 3000)
3. Database seeded: `npx prisma db seed` and `npx prisma db seed -- --csv`
   (the tests create most of their own data, but need the seeded users, suppliers and products)

## How to run

| What | Command |
|---|---|
| All inventory tests | `npx playwright test tests/inventory` |
| Watch them step by step | `npx playwright test tests/inventory --ui` |
| Only the bug tests | `npx playwright test tests/inventory --grep @bug` |
| Only the healthy checks | `npx playwright test tests/inventory --grep-invert @bug` |
| One file | `npx playwright test tests/inventory/inventory.spec.ts --ui` |
| Report of the last run | `npx playwright show-report` |

## How to read the results

- Tests **without** `@bug` check things that work today. They should be **green** (10 tests).
  If one turns red, a recent change broke something.
- Tests **with** `@bug` describe how the app *should* behave. They are **red** while the bug exists
  and turn **green** once someone fixes it (11 tests).
- A test may show as **skipped** if this database cannot set up its situation. The skip message
  explains why. This is not a pass.
- Check WHERE a red test stopped: at its last `expect` lines = bug found; at an early setup line =
  the test could not prepare (tell the person who wrote the test).

## Bugs these tests catch

| Test | Bug | Where |
|---|---|---|
| NEW-2 | "Low Stock" status filter only looks at the 20 rows of the current page | Inventory |
| NEW-1 | Paging through products shows some twice and skips others | Inventory (backend) |
| BUG-026 | "Total records" ignores the search box (0 rows shown, total above 0) | Adjustments |
| BUG-046 | Filtering start and end date to today shows nothing | Adjustments |
| BUG-062 | Stock staff get 403 errors on the Adjustments page | Adjustments |
| BUG-044 | Cashier and stock staff see "Add Bin Location", but saving fails with 403 | Bin Locations |
| BUG-001 | "Below reorder point" list in New Purchase Order only checks the first 100 products | Purchase Orders |
| BUG-036 | A PO can be set to FULFILLED with no delivery | Purchase Orders (backend) |
| BUG-126 | Same product in two units on one PO crashes the server (500) | Purchase Orders (backend) |
| BUG-015 | Receiving 5 pieces with a typed factor of 999 adds 4,995 to stock | Receive Deliveries (backend) |

BUG numbers refer to `BUGS.md` (branch `docs/bug-audit-register`). NEW-1 and NEW-2 are not in it.

- **NEW-1 cause:** `products.service.ts` sorts only by `createdAt`, and the CSV seed creates all
  2,571 products with the exact same timestamp. Likely fix: `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`.
- **NEW-2 cause:** `app/dashboard/inventory/page.tsx` filters low stock on the current page only
  (the code comment says so). The backend already has `GET /inventory/rop` with all low-stock products.

## No longer tested

- **ROP page:** removed from the menu on purpose. Note: `app/dashboard/inventory/rop/` still exists,
  so the page still opens if someone types `/dashboard/inventory/rop` in the address bar.
- **BUG-165** (delivery "Print Receipt" printed a blank page): the button was removed in PR #73.

## Good to know

- These tests **change data in your local database**: they create purchase orders, deliveries,
  stock adjustments and bins (names start with `PW-`). That is fine for local test data.
  To start fresh: `npx prisma migrate reset`, then the two seed commands.
- `helpers.ts` holds the shared pieces: test accounts, `loginAs()`, `watchForErrors()` and `Api`
  (talks to the backend directly, used to prepare data and to test backend rules).
- Changes sent through the API need an `Idempotency-Key` header. `Api` adds it automatically.
- The backend allows 100 requests per minute per endpoint. Running the whole suite many times in a
  row can hit this limit (status 429). Wait a minute and run again.
