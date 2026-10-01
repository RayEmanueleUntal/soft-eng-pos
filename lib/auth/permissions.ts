// Role-based action permissions for the POS system's frontend.
// Mirrors the backend roles allowed to change stock (adjust, stock-in, stock-out, bin assignment).
// Used to hide or disable inventory actions for read-only roles.
import { ROLES, Role } from "./roles";

export const STOCK_MANAGEMENT_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STOCK_MANAGEMENT,
];

// Returns true if the role may change stock levels or bin assignments.
export function canManageStock(role: string | null | undefined): boolean {
  return !!role && STOCK_MANAGEMENT_ROLES.includes(role as Role);
}
