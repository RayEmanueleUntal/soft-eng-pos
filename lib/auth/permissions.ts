// Role-based action permissions for the POS system's frontend.
// Mirrors the backend roles allowed to change stock (adjust, stock-in, stock-out, bin assignment).
// Used to hide or disable inventory actions for read-only roles.
import { ROLES, Role } from "./roles";

export const STOCK_MANAGEMENT_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STOCK_MANAGEMENT,
];

export const ROP_EDIT_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.SECRETARY,
];

// Returns true if the role may change stock levels or bin assignments.
export function canManageStock(role: string | null | undefined): boolean {
  return !!role && STOCK_MANAGEMENT_ROLES.includes(role as Role);
}

// Returns true if the role may edit a product's reorder point (backend: PATCH /products/{id}).
export function canEditROP(role: string | null | undefined): boolean {
  return !!role && ROP_EDIT_ROLES.includes(role as Role);
}

export const PO_CREATE_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STOCK_MANAGEMENT,
  ROLES.SECRETARY,
];

export const PO_STATUS_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STOCK_MANAGEMENT,
];

// Returns true if the role may create purchase orders (backend: POST /purchase-orders).
export function canCreatePO(role: string | null | undefined): boolean {
  return !!role && PO_CREATE_ROLES.includes(role as Role);
}

// Returns true if the role may change a PO's status (backend: PATCH /purchase-orders/{id}/status).
export function canManagePOStatus(role: string | null | undefined): boolean {
  return !!role && PO_STATUS_ROLES.includes(role as Role);
}
