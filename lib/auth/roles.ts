// Role definitions and per-route access rules for the POS system.
// The longest matching path wins, so sub-pages can be stricter than their parent module.
// proxy.ts uses ROLE_PERMISSIONS to redirect users away from pages their role may not open.
export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STOCK_MANAGEMENT: "STOCK_MANAGEMENT",
  SECRETARY: "SECRETARY",
  SALES_CLERK: "SALES_CLERK",
  CASHIER: "CASHIER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.STOCK_MANAGEMENT,
    ROLES.CASHIER,
    ROLES.SECRETARY,
    ROLES.SALES_CLERK,
  ],

  "/dashboard/pos": [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],

  "/dashboard/products": [ROLES.ADMIN, ROLES.MANAGER, ROLES.SECRETARY],

  "/dashboard/inventory": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.STOCK_MANAGEMENT,
    ROLES.SECRETARY,
  ],

  "/dashboard/forwarders": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SECRETARY,
    ROLES.CASHIER,
  ],

  "/dashboard/inventory/shipments": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SECRETARY,
    ROLES.CASHIER,
  ],

  "/dashboard/suppliers": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SECRETARY,
    ROLES.STOCK_MANAGEMENT,
  ],

  "/dashboard/inventory/deliveries": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.STOCK_MANAGEMENT,
    ROLES.SECRETARY,
  ],

  "/dashboard/customers": [ROLES.ADMIN, ROLES.MANAGER, ROLES.SECRETARY],

  "/dashboard/staff": [ROLES.ADMIN, ROLES.MANAGER],

  "/dashboard/admin": [ROLES.ADMIN, ROLES.MANAGER, ROLES.SECRETARY],
};
