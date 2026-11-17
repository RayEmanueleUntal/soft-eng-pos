// INVENTORY PAGE TESTS
//
// NEW-2 (not in BUGS.md; replaces the old ROP page, which was removed from the menu).
// The Inventory page's Status filter "Low Stock" only filters the 20 rows of the CURRENT page.
// The code even says so (app/dashboard/inventory/page.tsx: "Low-stock tabs only filter the rows
// on the current page"). With 2,500+ products, choosing "Low Stock" on page 1 hides almost every
// low-stock product, which is exactly what staff use this filter to find.

import { test, expect } from '@playwright/test';
import { Api, loginAs } from './helpers';

test('@bug NEW-2 "Low Stock" shows low-stock products from every page', async ({ page, request }) => {
  const api = await Api.login(request);
  const flagged = await api.flagLowStockProductOutsideFirst(20); // the Inventory page shows 20 per page
  test.skip(flagged === null, 'Could not place a low-stock product outside page 1 on this database (NEW-1 paging bug).');

  try {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();

    // Open the "Status" dropdown (it shows "All Stocks") and choose "Low Stock".
    await page.getByRole('combobox').filter({ hasText: 'All Stocks' }).click();
    await page.getByRole('option', { name: 'Low Stock' }).click();

    await expect(page.getByRole('cell', { name: flagged!.product.sku, exact: true })).toBeVisible();
  } finally {
    await flagged?.restore();
  }
});
