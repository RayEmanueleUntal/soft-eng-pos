# Inventory tests (Playwright)

Tests for the Inventory pages: Inventory, Adjustments, Bins, Deliveries, Purchase Orders, ROP and Shipments.

## Before you run them

1. Backend running: `npm run start:dev` in `soft-eng-pos-api` (port 3001)
2. Frontend running: `npm run dev` in `soft-eng-pos` (port 3000)
3. Database seeded: `npx prisma db seed` and `npx prisma db seed -- --csv`

## How to run

| What | Command |
|---|---|
| All inventory tests | `npx playwright test tests/inventory` |
| Watch them step by step | `npx playwright test tests/inventory --ui` |
| Only the bug tests | `npx playwright test tests/inventory --grep @bug` |
| Only the healthy checks | `npx playwright test tests/inventory --grep-invert @bug` |
| One file | `npx playwright test tests/inventory/rop.spec.ts --ui` |
| Report of the last run | `npx playwright show-report` |

## How to read the results

- Tests **without** `@bug` check things that work today. They should be **green**.
  If one turns red, a recent change broke something.
- Tests **with** `@bug` describe how the app *should* behave. They are **red** while the bug exists
  and turn **green** once someone fixes it. Each one names its entry in `BUGS.md`
  (branch `docs/bug-audit-register`).

## Bugs these tests catch

| Test | Bug | Page |
|---|---|---|
| BUG-001 | ROP page only checks the first 100 products, so most low-stock items never show | ROP |
| BUG-026 | "Total records" ignores the search box (0 rows shown, total above 0) | Adjustments |
| BUG-046 | Filtering start and end date to today shows nothing | Adjustments |
| BUG-062 | Stock staff get 403 errors on the Adjustments page | Adjustments |
| BUG-044 | Cashier and stock staff see "Add Bin Location", but saving fails with 403 | Bins |
| BUG-165 | "Print Receipt" on a delivery prints a blank page | Deliveries |
| BUG-015 | Receiving 5 pieces with a typed factor of 999 adds 4,995 to stock | Deliveries (backend) |
| BUG-036 | A PO can be set to FULFILLED with no delivery | Purchase Orders (backend) |
| BUG-126 | Same product in two units on one PO crashes the server (500) | Purchase Orders (backend) |
| NEW | Paging through products shows some twice and skips others | Inventory (backend) |

The NEW bug is not in `BUGS.md`. Cause: `products.service.ts` sorts only by `createdAt`, and
the CSV seed creates many products at the same moment. Likely fix:
`orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`.

## Good to know

- These tests **change data in your local database**: they create purchase orders, deliveries,
  stock adjustments and bins (names start with `PW-`). That is fine for local test data.
  To start fresh: `npx prisma migrate reset`, then the two seed commands.
- `helpers.ts` holds the shared pieces: test accounts, `loginAs()`, `watchForErrors()` and `Api`
  (talks to the backend directly, used to prepare data and to test backend rules).
- Changes sent through the API need an `Idempotency-Key` header. `Api` adds it automatically.
