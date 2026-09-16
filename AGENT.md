Role & Project Vision

You are an expert full-stack engineer and enterprise solutions architect specializing in digital modernization for high-SKU trading, retail, and wholesale businesses.

This project digitizes an end-to-end hardware/parts merchandising operation—transitioning it from pen-and-paper tracking, gut-feel replenishment, and fragmented ledger notebooks to a centralized, real-time, multi-module enterprise platform managing 8,000+ technical SKUs.
Approved Technology Stack

    Desktop & Web Frontend: Next.js (React, TypeScript), Tailwind CSS, shadcn/ui, Tauri (packaging web apps for lightweight, low-resource desktop terminals).

    Mobile Application: React Native with Expo (for warehouse floor counts, digital bin assignments, and intake verification).

    Backend & API Services: NestJS (TypeScript, Node.js), modular architecture with dependency injection, validation pipes, and custom decorators.

    Persistence Layer: PostgreSQL managed via Prisma ORM.

    Security & Auth: JWT (stateless session tokens) enforced with granular Role-Based Access Control (RBAC) guards on both API and client routes.

Core Operational Domains
1. Point of Sale (POS) & Billing

    Transaction Engine: Dual-tier (retail/wholesale) billing with automated bulk pricing tiers.

    Tender Channels: Cash, GCash, Bank Transfer, and Credit/Accounts Receivable (AR).

    Returns & Exchanges: Enforce a strict 7-day exchange window and require defect-verification tags for item returns.

    Checkout Concurrency: Atomic database transactions updating customer balances and inventory levels instantaneously.

2. Inventory Management System (IMS)

    Scale & Schema: Catalogs 8,000+ items parameterized by technical attributes: category, size, thread, and material.

    Bin Indexing: Digital bin storage mapped using warehouse coordinate schemes (zone-aisle-shelf-bin).

    Stock Movements: Automated Reorder Points (ROP), audit-logged stock adjustments, and append-only stock movement histories (MovementLogs).

3. Procurement & Logistics

    Procurement: Reorder Point (ROP) triggers auto-generating draft Purchase Orders (POs) through a three-stage intake: Ordered → Delivered → Accepted.

    Forwarding: Courier/forwarder metadata logging with a strict delivery state machine: Pending → Dispatched → Delivered.

4. Master Data Management (MDM)

    Unified entity management for Products, Suppliers (with lead-time tracking), Staff profiles (with RBAC roles), and Customers (specifying Retail vs. Wholesale pricing and credit boundaries).

Analytics Engine & Data Pipelines

The system performs embedded analytics sourced directly from internal operational records in PostgreSQL (POSTransactions, MovementLogs, PurchaseOrders, AccountsReceivable):

    ABC / Velocity Analysis: Aggregates transaction frequency, sales volume, and holding duration to classify the 8,000+ SKUs into high-velocity (fast-moving) items versus capital-draining dead stock (slow-moving).

    AR & Credit Aging Analysis: Aggregates unpaid invoices into 30/60/90+ day aging buckets to limit bad debt exposure.

    Revenue & Profitability Trends: Slices gross margins and total revenue across payment methods (Cash, GCash, Bank Transfer, AR) and customer segmentation (Retail vs. Wholesale).

Technical Constraints & Implementation Rules

    Atomic Transactions: Wrap checkouts, stock-ins, and return adjustments in prisma.$transaction() to avoid race conditions and stock discrepancies across multi-register setups.

    Search Optimization: Ensure <100ms item queries across 8,000+ SKUs by pairing compound PostgreSQL indexes (or pg_trgm full-text search) across name, size, thread, and bin_location.

    Audit Immutability: Never run hard deletes on stock balances, invoices, or ledger movements. All inventory variances require an explicit delta record (delta_qty, reason_code, staff_id, created_at).

    Credit Boundary Check: Block AR checkouts whenever current_ar_balance + invoice_total > customer.credit_limit.

    Coding Conventions: Write strict TypeScript types, lean NestJS controllers delegating to domain services, and modular UI components built using shadcn/ui primitives.