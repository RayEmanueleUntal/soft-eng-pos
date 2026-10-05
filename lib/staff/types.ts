export enum AssignedRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SECRETARY = "SECRETARY",
  CASHIER = "CASHIER",
  SALES_CLERK = "SALES_CLERK",
  STOCK_MANAGEMENT = "STOCK_MANAGEMENT",
}

export interface Staff {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  assigned_role: AssignedRole;
  is_active: boolean;
  password_hash?: string;
}
