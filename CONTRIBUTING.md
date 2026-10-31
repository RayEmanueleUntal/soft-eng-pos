# Contributing Guidelines

Thank you for contributing to the Hardware POS & Enterprise Management Frontend repository. To ensure codebase health, consistent design patterns, and smooth Pull Request reviews across all team members, please read and follow these guidelines carefully before contributing.

---

## 🚀 Quick Checklist Before Writing Code

1. **Review Context First:** Read `AGENT.md`, `design.md`, and `docs/architecture.md` before making structural or styling decisions.
2. **Use Shared Utilities:** Always use `lib/api.ts` for backend API integration and `getErrorMessage()` from `lib/utils.ts` for exception parsing.
3. **Respect Folder Boundaries:** Keep page-exclusive components in `_components/` under their respective route folder, shared domain components in `components/[domain]/`, and base primitives in `components/ui/`.
4. **Never Blindly Copy-Paste AI Output:** Thoroughly inspect, run, and test all AI-assisted code against real scenarios before submitting changes.

---

## 🌿 Git Branching Strategy

We follow a strict feature-branch workflow. All work must be conducted on a dedicated branch created off `main`.

### Branch Naming Conventions

- **Features:** `feature/<short-description>` (e.g., `feature/supplier-backend-integration`, `feature/purchase-orders-ui`)
- **Bug Fixes:** `fix/<short-description>` (e.g., `fix/pos-wholesale-pricing`, `fix/inventory-negative-stock-override`)
- **Refactoring & Cleanups:** `refactor/<short-description>` (e.g., `refactor/customer-modals`)

---

## 🛠️ Coding & Architectural Standards

### 1. API Calls & Exception Handling

- **No Custom Fetchers:** **Never** write raw `fetch()` calls or initialize custom `axios` instances. All backend requests must route through `lib/api.ts` to ensure JWT session headers are automatically applied.
- **Schema Validation:** Check the backend Swagger UI (`http://localhost:3001/api`) for exact request payloads, response interfaces, and HTTP exception models (e.g., `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
- **Error UI:** Pass caught errors through `getErrorMessage(error)` in `lib/utils.ts`. Present user-friendly error banners or toast notifications rather than failing silently.

### 2. Component Placement Rules

- **`components/ui/`**: Reserved strictly for generic, unstyled shadcn/ui primitives (`button.tsx`, `dialog.tsx`, `input.tsx`). **Do not put domain logic or API calls here.**
- **`components/[domain]/`**: Components shared across multiple pages within the same module (e.g., `components/inventory/InventoryTable.tsx`).
- **`_components/`**: Components used strictly by **one specific route** must be co-located directly in a `_components/` folder inside that route directory (e.g., `app/dashboard/inventory/rop/_components/RopHeader.tsx`).

### 3. UI/UX & Responsive Layouts

- **Tabular Numbers:** Use `JetBrains Mono` for all SKU codes, prices, quantities, and totals per `design.md`.
- **Layout Resilience:** Ensure tables and card grids do not break when rendering long text strings, vendor names, or addresses.
- **Viewport Testing:** Test layouts across standard desktop and laptop screen resolutions (e.g., 1080p and 1366x768).

---

## 🤖 AI Assistance & Code Safety Guidelines

Because our team heavily utilizes AI coding tools (e.g., Copilot, Cursor, ChatGPT):

1. **Verify Existing Infrastructure:** AI models often hallucinate new utility functions or duplicate existing components. Verify if a helper or component already exists in `lib/` or `components/` before accepting AI suggestions.
2. **No Unused Code:** Remove scratch files, unused imports, or leftover mock files prior to opening a PR.
3. **Manual Verification:** Test all AI-generated UI flows manually as if you were an end-user behind a hardware store counter.

---

## 📋 Submitting a Pull Request (PR)

Before submitting your PR for review:

1. **Self-Review Your Code:**
   - Run `npm run build` or `npx tsc --noEmit` and `npm run lint` locally to ensure there are no TypeScript compilation or linting errors.
   - Verify that no secrets or unintended environment files (like `.env.local`) are tracked in git.

2. **Respond to Feedback:** Address reviewer comments promptly and push updates directly to your feature branch.
