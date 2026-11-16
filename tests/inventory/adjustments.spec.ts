// STOCK ADJUSTMENTS & MOVEMENTS PAGE TESTS

import { test, expect } from '@playwright/test';
import { Api, loginAs, todayInTimeZone } from './helpers';

// Run these tests as if the browser were in the Philippines, like the real users.
const TIME_ZONE = 'Asia/Manila';
test.use({ timezoneId: TIME_ZONE });

// BUG-026 / BUG-123 in BUGS.md.
// The search box only filters the 20 rows already on screen, and "Total records"
// keeps showing the unfiltered count. A search with no matches shows 0 rows but a total above 0.
test('@bug BUG-026 "Total records" matches the search result', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard/inventory/adjustments');
  await expect(page.getByText(/Total records: [1-9]/)).toBeVisible(); // there is data to search

  await page.getByPlaceholder('Search product, SKU, reason...').fill('zz-no-such-item-zz');

  await expect(page.getByText('No stock movements found.')).toBeVisible();
  await expect(page.getByText(/Total records:/)).toHaveText('Total records: 0');
});

// BUG-046 in BUGS.md.
// The date filter turns "2026-11-16" into midnight UTC (8:00 AM in Manila). Picking the same
// day as start AND end date therefore covers zero time, and today's movements disappear.
test('@bug BUG-046 filtering by today shows the movements made today', async ({ page, request }) => {
  // 1. Make sure at least one movement happened today: count one product +1, then back again.
  const api = await Api.login(request);
  const { body } = await api.get('/products?limit=20');
  const product = body.data.find((p: any) => Number(p.current_quantity) >= 1); // a count of 0 is not allowed
  const original = Number(product.current_quantity);
  for (const newCount of [original + 1, original]) {
    const res = await api.post('/inventory/adjust', {
      productId: product.id,
      current_uom: product.base_uom,
      new_count: newCount,
      reason: 'PW-TEST date filter check',
    });
    expect(res.status, 'creating a test adjustment').toBeLessThan(400);
  }

  // 2. Filter the page to today only.
  await loginAs(page, 'admin');
  await page.goto('/dashboard/inventory/adjustments');
  await expect(page.getByText(/Total records: [1-9]/)).toBeVisible();

  const today = todayInTimeZone(TIME_ZONE);
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill(today); // start date
  await dateInputs.nth(1).fill(today); // end date

  // 3. Today's test adjustments must still be listed.
  await expect(page.getByText('No stock movements found.')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'PW-TEST date filter check' }).first()).toBeVisible();
});
