// API helpers for the admin Expenses page of the POS system.
// Wraps /expenses (list, detail, create, update, delete) via apiClient.
// Errors are not swallowed; callers pass them through getErrorMessage() for the UI.
import axios from "axios";
import { apiClient } from "@/lib/api";
import {
  CreateExpensePayload,
  ExpenseDto,
  FetchExpensesParams,
  PaginatedExpenses,
  UpdateExpensePayload,
} from "./expense-types";

// Returns true when the backend answered 404 (expense no longer exists).
export function isExpenseNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

// Fetches one page of expenses (GET /expenses); undefined filters are dropped by axios.
export async function fetchExpenses(
  params: FetchExpensesParams = {},
): Promise<PaginatedExpenses> {
  const response = await apiClient.get<PaginatedExpenses>("/expenses", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      category: params.category,
      payment_method: params.payment_method,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
  return response.data;
}

// Fetches a single expense (GET /expenses/{id}).
export async function fetchExpenseDetail(id: number): Promise<ExpenseDto> {
  const response = await apiClient.get<ExpenseDto>(`/expenses/${id}`);
  return response.data;
}

// Records an expense (POST /expenses); apiClient adds the Idempotency-Key header.
export async function createExpense(
  payload: CreateExpensePayload,
): Promise<ExpenseDto> {
  const response = await apiClient.post<ExpenseDto>("/expenses", payload);
  return response.data;
}

// Updates an expense (PATCH /expenses/{id}); apiClient adds the Idempotency-Key header.
export async function updateExpense(
  id: number,
  payload: UpdateExpensePayload,
): Promise<ExpenseDto> {
  const response = await apiClient.patch<ExpenseDto>(
    `/expenses/${id}`,
    payload,
  );
  return response.data;
}

// Deletes an expense (DELETE /expenses/{id}, 204 no body).
// apiClient only adds Idempotency-Key for POST/PUT/PATCH, so it is set here.
export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}
