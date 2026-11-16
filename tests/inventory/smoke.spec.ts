// SMOKE TESTS: does every Inventory page open without errors?
// These should all be GREEN today. If one turns red later, a recent change broke that page.

import { test, expect } from '@playwright/test';
import { loginAs, watchForErrors } from './helpers';

const inventoryPages = [
  { path: '/dashboard/inventory', heading: 'Inventory' },
  { path: '/dashboard/inventory/adjustments', heading: 'Stock Adjustments & Movements' },
  { path: '/dashboard/inventory/bins', heading: 'Bin Locations' },
  { path: '/dashboard/inventory/deliveries', heading: 'Deliveries' },
  { path: '/dashboard/inventory/purchase-orders', heading: 'Purchase Orders' },
  { path: '/dashboard/inventory/shipments', heading: 'Shipments' },
];

for (const { path, heading } of inventoryPages) {
  test(`admin can open ${path} without errors`, async ({ page }) => {
    await loginAs(page, 'admin');
    const errors = watchForErrors(page);

    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(errors.failedApiCalls, 'backend calls that failed').toEqual([]);
    expect(errors.consoleErrors, 'errors in the browser console').toEqual([]);
  });
}
