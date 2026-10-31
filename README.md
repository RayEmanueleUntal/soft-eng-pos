---
# Hardware & Trade Counter POS / ERP Frontend

An enterprise-grade, high-throughput Point of Sale (POS) and inventory management dashboard built with Next.js (App Router), Tailwind CSS, and TypeScript. Engineered specifically for high-SKU industrial hardware, wholesale trade counters, and warehouse logistics operations.
---

## 📸 Tech Stack Summary

- **Framework:** Next.js (App Router, React 19 / 18, TypeScript)
- **Styling & UI:** Tailwind CSS, shadcn/ui primitives, Lucide React icons
- **Design Tokens:** Muted industrial palette & tabular monospaced numbers (`design.md`)
- **HTTP & Middleware Client:** Custom Axios client with JWT session injection (`lib/api.ts`)
- **Backend API:** NestJS + PostgreSQL + Redis ([soft-eng-pos-api Repository](https://github.com/RayEmanueleUntal/soft-eng-pos-api))

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites

Ensure you have the following tools installed locally:

- **Node.js** (v18.x or v20.x recommended)
- **npm**, **pnpm**, **yarn**, or **bun**
- **Docker Desktop** (for running local database infrastructure)

---

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

```

---

### 3. Setting Up the Backend Infrastructure (Docker)

The backend API relies on PostgreSQL, Redis, and NestJS. To run the backend services locally, clone the backend repository alongside this project:

- **Backend Repository:** [https://github.com/RayEmanueleUntal/soft-eng-pos-api](https://github.com/RayEmanueleUntal/soft-eng-pos-api)

Inside the backend repository directory, run:

```bash
# 1. Start PostgreSQL & Redis services in Docker
docker compose up pos-db pos-redis -d

# 2. Reset / Migrate database schema (if needed)
npx prisma migrate reset

# 3. Seed database with initial master data
npx prisma db seed

# 4. Run the backend NestJS development server locally
npm run start:dev

```

> **Developer Note on Docker API Container:**
> Running `pos-api` via Docker during active backend feature development can cause port conflicts when running `npm run start:dev` locally on your host machine. Keep `pos-db` and `pos-redis` running in Docker, but execute `npm run start:dev` inside the API repo locally.

- **Swagger API Documentation:** Access the live interactive endpoints at `http://localhost:3000/api` when the server is running.

---

### 4. Running the Frontend Development Server

Install dependencies and launch the dev server:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 📂 Repository Layout & Architecture Overview

The repository enforces modular co-location and strict domain boundaries:

```text
├── app/                        <-- Next.js App Router Pages & API Route Proxies
│   ├── api/                    <-- Local Next.js auth route handlers (/me, /session, /logout)
│   ├── auth/                   <-- Login & session flows
│   │   └── _components/        <-- Route-exclusive components
│   └── dashboard/              <-- Main Authenticated Dashboard Shell
│       ├── admin/              <-- System Settings & Approval Requests (Admin only)
│       ├── analytics/          <-- Embedded Financial & Velocity Analytics
│       ├── customers/          <-- Customer Profiles & Wholesale Accounts
│       ├── forwarders/         <-- Logistics Forwarder Profiles
│       ├── inventory/          <-- Stock management, ROP, Bins, Deliveries, Shipments
│       ├── pos/                <-- POS Register & Receipt Views
│       ├── products/           <-- Product Catalog & Technical SKU Management
│       ├── staff/              <-- RBAC Staff Directory & Permissions
│       └── suppliers/          <-- Supplier Master Records
│
├── components/                 <-- UI Components
│   ├── ui/                     <-- Pure shadcn/ui primitives (badge, button, input, table)
│   ├── customers/              <-- Cross-page Customer domain components
│   ├── inventory/              <-- Cross-page Inventory domain components
│   └── pos/                    <-- Cross-page POS terminal components
│
├── lib/                        <-- Shared Business Logic & Service Modules
│   ├── api.ts                  <-- Unified Axios instance (JWT, auth headers, base URL)
│   ├── utils.ts                <-- Tailwing class merge (cn) & error handler (getErrorMessage)
│   └── [domain]/               <-- Domain service interfaces & API callers
│
├── docs/                       <-- Architecture & Design Documentation
│   ├── architecture.md         <-- Engineering standards & component placement rules
│   └── design-system.md        <-- UI specs, color tokens, & monospaced typography rules
│
├── .env.local                  <-- Local environment variables (Git ignored)
├── AGENT.md                    <-- Core project vision & AI system instructions
├── CHANGELOG.md                <-- Historical log of features and structural updates
└── design.md                   <-- UI color palette, spacing grid, and typography tokens

```

---

## 🛠 Engineering & Workflow Standards

### Component Placement Rule

1. **`components/ui/`**: Generic, un-styled or base design system primitives generated via `shadcn/ui`. **No domain logic or API calls allowed here.**
2. **`components/[domain]/`**: Shared domain components used by multiple pages (e.g., `components/inventory/InventoryTable.tsx`).
3. **`_components/`**: Page-exclusive components co-located directly within their parent route (e.g., `app/dashboard/inventory/rop/_components/RopHeader.tsx`).

### API Requests & Error Handling

- **API Calls:** All requests **must** use `lib/api.ts`. Do not write raw `fetch` calls or create custom Axios instances.
- **Error Parsing:** Wrap try/catch backend errors with `getErrorMessage(error)` from `lib/utils.ts` to cleanly extract NestJS validation arrays, 401/403/404 exceptions, and network errors.

### Git & Pull Request Guidelines

- Branch naming format: `feature/short-description` or `fix/short-description`.
- Always consult `docs/architecture.md`, `AGENT.md`, and `design.md` prior to building new feature workflows.
- Every Pull Request must include a clear summary of changes and a step-by-step testing guide for reviewers.

---

## 📖 Documentation Quick Links

- **[Architecture Guidelines](https://www.google.com/search?q=docs/architecture.md):** Full breakdown of routes, domain helpers, and co-location rules.
- **[Design Tokens (`design.md`)](design.md):** Color definitions, tabular typography rules, and density guidelines.
- **[Project Vision (`AGENT.md`)](AGENT.md):** Operational domains, business logic constraints, and domain entity models.
- **[Contributing Guidelines (`CONTRIBUTING.md`)](CONTRIBUTING.md):** Guidelines for contributors.
