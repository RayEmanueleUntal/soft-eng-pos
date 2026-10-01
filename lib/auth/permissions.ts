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
