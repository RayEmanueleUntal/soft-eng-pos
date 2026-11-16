// PRODUCT LIST PAGING TEST (NEW bug, not in BUGS.md)
//
// The backend sorts products only by creation time (orderBy createdAt desc). The CSV seed
// creates hundreds of products in the same instant, so their order is unpredictable from one
// page to the next. Paging through the list shows some products twice and skips others.
// The Inventory table uses this list, so the skipped products can never be reached with "Next".
//
// Likely fix (backend, products.service.ts): orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]

import { test, expect } from '@playwright/test';
import { Api } from './helpers';

test('@bug NEW paging through all products shows each product exactly once', async ({ request }) => {
  const api = await Api.login(request);
  const first = await api.get('/products?limit=100&page=1');
  const { total, totalPages } = first.body.meta;

  const timesSeen = new Map<number, number>();
  for (let page = 1; page <= totalPages; page++) {
    const { body } = await api.get(`/products?limit=100&page=${page}`);
    for (const product of body.data) {
      timesSeen.set(product.id, (timesSeen.get(product.id) ?? 0) + 1);
    }
  }
  const shownTwice = [...timesSeen].filter(([, count]) => count > 1).map(([id]) => id);

  expect(shownTwice, 'product ids that appeared on more than one page').toEqual([]);
  expect(timesSeen.size, 'number of different products seen while paging').toBe(total);
});
