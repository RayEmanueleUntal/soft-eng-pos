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

  async firstSupplierId(): Promise<number> {
    const { body } = await this.get('/suppliers?limit=1');
    return (body.data ?? body)[0].id;
  }
}

// Today's date as YYYY-MM-DD in the browser's own time zone (what a date picker shows).
export function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
