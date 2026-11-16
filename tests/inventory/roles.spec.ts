// ROLE TESTS: do different staff roles get the right access on Inventory pages?
// Tests tagged @bug are expected to be RED until the bug is fixed.

import { test, expect } from '@playwright/test';
import { loginAs, watchForErrors } from './helpers';

// Healthy check (GREEN): cashiers are sent away from pages they may not use.
for (const path of [
  '/dashboard/inventory/adjustments',
  '/dashboard/inventory/deliveries',
  '/dashboard/inventory/purchase-orders',
]) {
  test(`cashier is redirected away from ${path}`, async ({ page }) => {
    await loginAs(page, 'cashier');
    await page.goto(path);
    await expect(page).not.toHaveURL(new RegExp(`${path}$`));
  });
}

// BUG-062 in BUGS.md.
// Stock management staff may use the Adjustments page, but the page asks the backend for
// staff names (GET /staff-users/:id), which only ADMIN and MANAGER may call. Result: 403 errors.
test('@bug BUG-062 stock staff can open Adjustments without backend errors', async ({ page }) => {
  await loginAs(page, 'stock');
  const errors = watchForErrors(page);

  await page.goto('/dashboard/inventory/adjustments');
  await expect(page.getByRole('heading', { name: 'Stock Adjustments & Movements' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(errors.failedApiCalls, 'backend calls that failed').toEqual([]);
});

// BUG-044 / BUG-122 in BUGS.md.
// The backend only lets ADMIN, MANAGER and SECRETARY create bins (POST /bin-location),
// but cashiers and stock staff are still shown the "Add Bin Location" button.
// Either fix is fine: hide the button for them, or allow them in the backend.
for (const role of ['cashier', 'stock'] as const) {
  test(`@bug BUG-044 ${role}: "Add Bin Location" is hidden or actually works`, async ({ page }) => {
    await loginAs(page, role);
    await page.goto('/dashboard/inventory/bins');
    await expect(page.getByRole('heading', { name: 'Bin Locations' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: 'Add Bin Location' });
    if (await addButton.isHidden()) {
      return; // Fixed by hiding the button. Nothing more to check.
    }

    // The button is shown, so saving a bin must work.
    const unique = Date.now().toString().slice(-6);
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#aisle_number').fill(`PW-AISLE-${unique}`);
    await dialog.locator('#shelf_location').fill(`PW-SHELF-${unique}`);
    const saveRequest = page.waitForResponse(
      (res) => res.url().endsWith('/bin-location') && res.request().method() === 'POST',
    );
    await dialog.locator('button[type="submit"]').click();

    expect((await saveRequest).status(), 'status of the "save bin" request').toBeLessThan(400);
    await expect(dialog).toBeHidden(); // the dialog closes after a successful save
  });
}
