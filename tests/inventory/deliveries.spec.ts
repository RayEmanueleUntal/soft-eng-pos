// DELIVERIES TESTS
//
// Note: the BUG-165 test ("Print Receipt" printed a blank page) was removed, because
// PR #73 removed the Print Receipt button from the delivery details.

import { test, expect } from '@playwright/test';
import { Api } from './helpers';

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
