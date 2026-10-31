# Frontend Architecture & Engineering Guidelines

This document outlines the architectural patterns, directory conventions, data-fetching standards, and development workflows for the Next.js Frontend repository.

---

## 1. System Overview & Technology Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS, custom design tokens (`design.md`)
- **UI Components:** shadcn/ui primitives (`components/ui/`)
- **HTTP Client:** Axios instance wrapper (`lib/api.ts`)
- **Proxy/Auth:** Node HTTP Proxy (`proxy.ts`) for JWT session token handling

---

## 2. Directory & Route Architecture

### App Directory Structure (`app/`)

The `app/` directory exclusively manages routing, layouts, and page shells:

```text
app/
├── api/                   <-- Local Next.js route handlers (Auth proxies & session management)
│   └── auth/
│       ├── logout/route.ts
│       ├── me/route.ts
│       └── session/route.ts
├── auth/                  <-- Authentication flows
│   └── login/page.tsx
├── dashboard/             <-- Primary authenticated application layout
│   ├── admin/             <-- Admin-restricted operations
│   │   ├── approval-requests/page.tsx
│   │   └── system-settings/page.tsx
│   ├── analytics/         <-- Analytics & reporting (Admin & Manager only)
│   ├── customers/page.tsx
│   ├── forwarders/        <-- Logistics & carrier master data
│   │   └── page.tsx
│   ├── inventory/         <-- Stock management domain
│   │   ├── adjustments/page.tsx
│   │   ├── bins/page.tsx
│   │   ├── deliveries/page.tsx
│   │   ├── rop/page.tsx
│   │   └── shipments/     <-- Dispatch tracking
│   ├── pos/               <-- Point of Sale terminal & receipt view
│   │   ├── page.tsx
│   │   └── receipt/[id]/page.tsx
│   ├── products/page.tsx
│   ├── staff/page.tsx
│   ├── suppliers/page.tsx
│   ├── layout.tsx         <-- Dashboard navigation sidebar & context
│   └── page.tsx           <-- Main dashboard metrics overview
├── globals.css
├── layout.tsx             <-- Root layout wrapper
└── page.tsx               <-- Entry landing / auth redirect
```
