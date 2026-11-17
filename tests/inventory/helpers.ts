// Shared helpers for the Inventory tests.
// Every test file in this folder imports what it needs from here.

import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

// Where the NestJS backend runs. Matches PORT=3001 in soft-eng-pos-api/.env.
export const API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Test accounts created by `npx prisma db seed` in the backend.
export const USERS = {
  admin: { username: 'admin123', password: 'adminpassword123' },
  manager: { username: 'manager_john', password: 'staff123456' },
  cashier: { username: 'cashier_mary', password: 'staff123456' },
  stock: { username: 'stock_alex', password: 'staff123456' },
} as const;

export type UserKey = keyof typeof USERS;

// Logs in through the real login form, the same way a person would.
export async function loginAs(page: Page, user: UserKey) {
  const { username, password } = USERS[user];
  await page.goto('/auth/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Starts recording browser console errors and failed backend calls (status 400 or higher).
// Call it BEFORE page.goto(), then read .consoleErrors and .failedApiCalls at the end.
export function watchForErrors(page: Page) {
  const found = { consoleErrors: [] as string[], failedApiCalls: [] as string[] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') found.consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.url().startsWith(API_URL) && res.status() >= 400) {
      found.failedApiCalls.push(`${res.status()} ${res.request().method()} ${res.url().replace(API_URL, '')}`);
    }
  });
  return found;
}

// Talks to the backend directly, without the browser.
// Used to prepare test data and to test backend rules the UI cannot reach.
export class Api {
  private constructor(private request: APIRequestContext, private token: string) {}

  static async login(request: APIRequestContext, user: UserKey = 'admin') {
    const res = await request.post(`${API_URL}/auth/signin`, { data: USERS[user] });
    expect(res.ok(), `API login as ${user} failed with status ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return new Api(request, body.access_token);
  }

  // Every change (POST/PATCH) needs a unique Idempotency-Key header, or the backend answers 400.
  private headers() {
    return { Authorization: `Bearer ${this.token}`, 'Idempotency-Key': randomUUID() };
  }

  private async send(method: 'get' | 'post' | 'patch', path: string, data?: unknown) {
    const res = await this.request[method](`${API_URL}${path}`, { headers: this.headers(), data });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status(), body };
  }

  get(path: string) {
    return this.send('get', path);
  }
  post(path: string, data: unknown) {
    return this.send('post', path, data);
  }
  patch(path: string, data: unknown) {
    return this.send('patch', path, data);
  }

  async product(id: number) {
    const { body } = await this.get(`/products/${id}`);
    return body;
  }

  // Records two stock adjustments (count +1, then back to the original), so the
  // Adjustments page has movements from today even on a freshly seeded database.
  async createTodaysTestMovements(reason: string) {
    const { body } = await this.get('/products?limit=20');
    const product = body.data.find((p: any) => Number(p.current_quantity) >= 1); // a count of 0 is not allowed
    const original = Number(product.current_quantity);
    for (const newCount of [original + 1, original]) {
      const res = await this.post('/inventory/adjust', {
        productId: product.id,
        current_uom: product.base_uom,
        new_count: newCount,
        reason,
      });
      expect(res.status, 'creating a test adjustment').toBeLessThan(400);
    }
  }

  // Makes one of the OLDEST products drop below its reorder point, making sure it is NOT among
  // the first `firstN` products of the product list (the part a page loads and can see).
  // Because of the NEW-1 paging bug, an edited product can jump to the front of the list, so it
  // tries up to five products. Returns null if none stays outside (the test should then skip).
  // Always call restore() at the end to put the reorder point back.
  async flagLowStockProductOutsideFirst(firstN: number) {
    const first = await this.get('/products?limit=100&page=1');
    const last = await this.get(`/products?limit=100&page=${first.body.meta.totalPages}`);
    const candidates = last.body.data.slice(-5).reverse(); // the five oldest products

    for (const candidate of candidates) {
      const originalRop = Number(candidate.reorder_point_ROP);
      await this.patch(`/products/${candidate.id}`, { reorder_point_ROP: Number(candidate.current_quantity) + 10 });
      const restore = () => this.patch(`/products/${candidate.id}`, { reorder_point_ROP: originalRop });

      const visible = await this.get(`/products?limit=${firstN}`); // what the page would load
      if (!visible.body.data.some((p: any) => p.id === candidate.id)) {
        return { product: candidate, restore };
      }
      await restore(); // it jumped into the visible part, try the next one
    }
    return null;
  }

  async firstSupplierId(): Promise<number> {
    const { body } = await this.get('/suppliers?limit=1');
    return (body.data ?? body)[0].id;
  }
}

// Today's date as YYYY-MM-DD in the browser's own time zone (what a date picker shows).
export function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
