// PURCHASE ORDER TESTS (backend rules, tested through the API)

import { test, expect } from '@playwright/test';
import { Api } from './helpers';

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
