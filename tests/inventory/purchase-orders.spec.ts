// PURCHASE ORDER TESTS

import { test, expect } from '@playwright/test';
import { Api, loginAs } from './helpers';

// BUG-001 in BUGS.md (it used to be on the ROP page, which was removed from the menu).
// The "Below reorder point" quick-add list in the New Purchase Order form still uses
// fetchROPItems(), which only checks the first 100 products instead of asking the backend's
// /inventory/rop. Low-stock products further down the list never appear there.
test('@bug BUG-001 "Below reorder point" list shows every product the backend flags', async ({ page, request }) => {
  const api = await Api.login(request);
  const flagged = await api.flagLowStockProductOutsideFirst(100); // fetchROPItems() loads 100
  test.skip(flagged === null, 'Could not place a low-stock product outside the first 100 on this database (NEW-1 paging bug).');

  try {
    // The backend itself says this product needs reordering...
    const rop = await api.get('/inventory/rop');
    expect(JSON.stringify(rop.body.items), 'backend /inventory/rop list').toContain(flagged!.product.sku);

    // ...so the quick-add list in the New Purchase Order form should offer it too.
    await loginAs(page, 'admin');
    await page.goto('/dashboard/inventory/purchase-orders');
    await page.getByRole('button', { name: 'New Purchase Order' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Below reorder point')).toBeVisible();
    await expect(dialog.getByText(flagged!.product.sku)).toBeVisible();
  } finally {
    await flagged?.restore();
  }
});

// Healthy check (GREEN): a normal purchase order can be created and cancelled.
test('a normal purchase order can be created and cancelled', async ({ request }) => {
  const api = await Api.login(request);
  const { body } = await api.get('/products?limit=1');
  const supplierId = await api.firstSupplierId();

  const po = await api.post('/purchase-orders', {
    supplierId,
    items: [{ productId: body.data[0].id, requested_quantity: 3 }],
  });
  expect(po.status).toBe(201);
  expect(po.body.po_status).toBe('PENDING');

  const cancel = await api.patch(`/purchase-orders/${po.body.id}/status`, { po_status: 'CANCELLED' });
  expect(cancel.status).toBe(200);
});

// BUG-036 in BUGS.md.
// A purchase order can jump straight from PENDING to FULFILLED although nothing was delivered.
// FULFILLED should only happen by receiving deliveries (Ordered -> Delivered -> Accepted).
test('@bug BUG-036 a purchase order cannot be marked FULFILLED without a delivery', async ({ request }) => {
  const api = await Api.login(request);
  const { body } = await api.get('/products?limit=1');
  const supplierId = await api.firstSupplierId();

  const po = await api.post('/purchase-orders', {
    supplierId,
    items: [{ productId: body.data[0].id, requested_quantity: 3 }],
  });
  expect(po.status).toBe(201);

  const jump = await api.patch(`/purchase-orders/${po.body.id}/status`, { po_status: 'FULFILLED' });
  expect(jump.status, 'PENDING -> FULFILLED with no delivery should be refused').toBe(400);

  await api.patch(`/purchase-orders/${po.body.id}/status`, { po_status: 'CANCELLED' }); // clean up
});

// BUG-126 in BUGS.md.
// Ordering the same product in two units on one PO (e.g. single pieces AND packs of 100)
// crashes the backend with a 500 error. It should either work or give a clear 400 message.
test('@bug BUG-126 the same product in two units does not crash the server', async ({ request }) => {
  const api = await Api.login(request);
  const { body } = await api.get('/products?limit=100');
  const product = body.data.find((p: any) => p.uoms?.length > 0); // has a second unit
  const supplierId = await api.firstSupplierId();

  const po = await api.post('/purchase-orders', {
    supplierId,
    items: [
      { productId: product.id, requested_quantity: 5, ordered_uom: product.base_uom },
      { productId: product.id, requested_quantity: 1, ordered_uom: product.uoms[0].uom },
    ],
  });
  expect(po.status, `server answer: ${JSON.stringify(po.body)}`).toBeLessThan(500);
});
