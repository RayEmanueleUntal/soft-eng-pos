// DELIVERIES PAGE TESTS

import { test, expect } from '@playwright/test';
import { Api, loginAs } from './helpers';

// BUG-165 in BUGS.md.
// "Print Receipt" in the delivery details calls window.print(), but the app's print styles
// hide everything except a POS receipt. The printed delivery page comes out blank.
// Playwright can switch the page into "print mode" to see exactly what would be printed.
test('@bug BUG-165 a printed delivery receipt is not blank', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard/inventory/deliveries');
  await page.getByRole('button', { name: 'View' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: /Print Receipt/ })).toBeVisible();
  const title = page.getByText(/Delivery Receipt #/);
  await expect(title).toBeVisible(); // visible on screen...

  await page.emulateMedia({ media: 'print' });
  await expect(title).toBeVisible(); // ...and it should still be visible on paper
});

// BUG-015 in BUGS.md (backend rule, tested through the API).
// When receiving a delivery, the backend accepts any conversion factor the client sends.
// Receiving 5 pieces (PCS) with factor 999 adds 4,995 to stock instead of 5.
// Either fix is fine: reject the bad factor, or ignore it and add 5.
test('@bug BUG-015 receiving 5 pieces cannot add more than 5 to stock', async ({ request }) => {
  const api = await Api.login(request);
  const { body } = await api.get('/products?limit=20');
  const product = body.data.find((p: any) => p.base_uom === 'PCS');
  const supplierId = await api.firstSupplierId();

  const po = await api.post('/purchase-orders', {
    supplierId,
    items: [{ productId: product.id, requested_quantity: 5, ordered_uom: 'PCS' }],
  });
  expect(po.status, 'creating the test purchase order').toBe(201);

  const stockBefore = Number((await api.product(product.id)).current_quantity);
  const delivery = await api.post('/deliveries', {
    poId: po.body.id,
    items: [{ productId: product.id, received_quantity: 5, received_uom: 'PCS', uom_conversion_factor: 999 }],
  });
  const stockAfter = Number((await api.product(product.id)).current_quantity);

  const accepted = delivery.status < 400;
  expect(stockAfter - stockBefore, 'change in stock').toBe(accepted ? 5 : 0);
});
