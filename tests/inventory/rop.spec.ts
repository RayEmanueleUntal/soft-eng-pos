// ROP (Reorder Point) PAGE TEST
//
// BUG-001 in BUGS.md.
// The ROP page only checks the first 100 products (GET /products?limit=100) instead of
// asking the backend's /inventory/rop endpoint. With 2,500+ products, most low-stock
// items never appear, so nobody reorders them.
//
// The test makes the OLDEST product drop below its reorder point (the product list is sorted
// newest first, so the oldest one is always far beyond the first 100), checks that the backend
// flags it, checks the ROP page, and then puts the reorder point back.

import { test, expect } from '@playwright/test';
import { Api, loginAs } from './helpers';

test('@bug BUG-001 ROP page lists every product the backend flags for reorder', async ({ page, request }) => {
  const api = await Api.login(request);
  const firstPage = await api.get('/products?limit=100&page=1');
  const lastPage = await api.get(`/products?limit=100&page=${firstPage.body.meta.totalPages}`);
  const product = lastPage.body.data.at(-1); // the oldest product
  const originalRop = Number(product.reorder_point_ROP);

  await api.patch(`/products/${product.id}`, { reorder_point_ROP: Number(product.current_quantity) + 10 });
  try {
    // The backend itself says this product needs reordering...
    const rop = await api.get('/inventory/rop');
    expect(JSON.stringify(rop.body.items), 'backend /inventory/rop list').toContain(product.sku);

    // ...so the ROP page should show it too.
    await loginAs(page, 'admin');
    await page.goto('/dashboard/inventory/rop');
    await expect(page.getByRole('cell', { name: product.sku, exact: true })).toBeVisible();
  } finally {
    await api.patch(`/products/${product.id}`, { reorder_point_ROP: originalRop });
  }
});
