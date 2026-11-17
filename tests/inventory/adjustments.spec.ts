// STOCK ADJUSTMENTS & MOVEMENTS PAGE TESTS
// Both tests first create their own stock movements, so they work on any database.

import { test, expect } from '@playwright/test';
import { Api, loginAs, todayInTimeZone } from './helpers';

// Run these tests as if the browser were in the Philippines, like the real users.
const TIME_ZONE = 'Asia/Manila';
test.use({ timezoneId: TIME_ZONE });

// BUG-026 / BUG-123 in BUGS.md.
// The search box only filters the 20 rows already on screen, and "Total records"
// keeps showing the unfiltered count. A search with no matches shows 0 rows but a total above 0.
test('@bug BUG-026 "Total records" matches the search result', async ({ page, request }) => {
  const api = await Api.login(request);
  await api.createTodaysTestMovements('PW-TEST search check');

  await loginAs(page, 'admin');
  await page.goto('/dashboard/inventory/adjustments');
  await expect(page.getByText(/Total records: [1-9]/)).toBeVisible(); // there is data to search

  // A regular expression (/.../) matches the start of the placeholder text,
  // so the test keeps working if the rest of the wording changes again.
  await page.getByPlaceholder(/^Search product/).fill('zz-no-such-item-zz');

  await expect(page.getByText('No stock movements found.')).toBeVisible();
  await expect(page.getByText(/Total records:/)).toHaveText('Total records: 0');
});

// BUG-046 in BUGS.md.
// The date filter turns "2026-11-16" into midnight UTC (8:00 AM in Manila). Picking the same
// day as start AND end date therefore covers zero time, and today's movements disappear.
test('@bug BUG-046 filtering by today shows the movements made today', async ({ page, request }) => {
  const api = await Api.login(request);
  await api.createTodaysTestMovements('PW-TEST date filter check');

  await loginAs(page, 'admin');
  await page.goto('/dashboard/inventory/adjustments');
  await expect(page.getByText(/Total records: [1-9]/)).toBeVisible();

  const today = todayInTimeZone(TIME_ZONE);
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill(today); // start date
  await dateInputs.nth(1).fill(today); // end date

  // Today's test adjustments must still be listed.
  await expect(page.getByText('No stock movements found.')).toBeHidden();
  await expect(page.getByRole('cell', { name: 'PW-TEST date filter check' }).first()).toBeVisible();
});
