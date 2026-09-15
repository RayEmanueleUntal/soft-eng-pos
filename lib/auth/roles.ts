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

  "/dashboard/inventory": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.STOCK_MANAGEMENT,
    ROLES.CASHIER,
    ROLES.SECRETARY,
    ROLES.SALES_CLERK,
  ],

  "/dashboard/products": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.STOCK_MANAGEMENT,
    ROLES.CASHIER,
    ROLES.SECRETARY,
    ROLES.SALES_CLERK,
  ],

  "/dashboard/customers": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SECRETARY,
    ROLES.CASHIER,
  ],

  "/dashboard/staff": [ROLES.ADMIN, ROLES.MANAGER],
};
