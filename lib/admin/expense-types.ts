// Shared TypeScript types for the admin Expenses page of the POS system.
// Mirrors the backend ExpenseResponseDto, PaginatedExpensesResponseDto and create/update payloads.
// Used by expense-api.ts and the /dashboard/admin/expenses components.
import type { ExpenseCategory, PaymentMethod } from "@/lib/analytics/types";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SALARIES_WAGES: "Salaries & Wages",
  TAXES_LICENCES: "Taxes & Licences",
  MAINTENANCE: "Maintenance",
  LOGISTICS: "Logistics",
  SUPPLIES: "Supplies",
  MISCELLANEOUS: "Miscellaneous",
};

// Staff member who logged the expense; the backend returns null if the record has no staff link.
export interface ExpenseStaff {
  id: number;
  first_name: string;
  last_name: string;
}

export interface ExpenseDto {
  id: number;
  category: ExpenseCategory;
  amount: number;
  date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  staffId: number;
  staff: ExpenseStaff | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedExpenses {
  data: ExpenseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
}

export interface FetchExpensesParams {
  page?: number;
  limit?: number;
  category?: ExpenseCategory;
  payment_method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

// The backend attaches staffId from the logged-in user, so it is never sent.
export interface CreateExpensePayload {
  category: ExpenseCategory;
  amount: number;
  payment_method?: PaymentMethod;
  date?: string;
  notes?: string;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

// Filter state of the expenses page; dates are YYYY-MM-DD values from the date inputs.
export interface ExpenseFilters {
  category: ExpenseCategory | "";
  payment_method: PaymentMethod | "";
  startDate: string;
  endDate: string;
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  category: "",
  payment_method: "",
  startDate: "",
  endDate: "",
};
