// Admin Expenses page of the POS dashboard.
// Lets Admin and Manager record, filter, edit and delete store operating expenses (OpEx).
// Composes the filter bar, expense table and the create/edit/delete dialogs.
"use client";

import * as React from "react";
import { CheckCircle2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/pageheader";
import {
  fetchExpenseDetail,
  fetchExpenses,
  isExpenseNotFound,
} from "@/lib/admin/expense-api";
import {
  EMPTY_EXPENSE_FILTERS,
  ExpenseDto,
  ExpenseFilters,
} from "@/lib/admin/expense-types";
import { getErrorMessage } from "@/lib/utils";
import { CreateExpenseModal } from "./_components/CreateExpenseModal";
import { DeleteExpenseDialog } from "./_components/DeleteExpenseDialog";
import { EditExpenseModal } from "./_components/EditExpenseModal";
import {
  ExpenseFilterBar,
  isInvalidDateRange,
} from "./_components/ExpenseFilterBar";
import { ExpenseTable } from "./_components/ExpenseTable";

const PAGE_LIMIT = 10;

// Renders the expenses list with filters and the create, edit and delete flows.
export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<ExpenseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [filters, setFilters] =
    React.useState<ExpenseFilters>(EMPTY_EXPENSE_FILTERS);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ExpenseDto | null>(null);
  const [fetchingId, setFetchingId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ExpenseDto | null>(
    null,
  );

  const rangeInvalid = isInvalidDateRange(filters);

  // Loads the current page of expenses for the active filters.
  const loadExpenses = React.useCallback(async () => {
    if (rangeInvalid) {
      setExpenses([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchExpenses({
        page,
        limit: PAGE_LIMIT,
        category: filters.category || undefined,
        payment_method: filters.payment_method || undefined,
        startDate: filters.startDate
          ? new Date(`${filters.startDate}T00:00:00`).toISOString()
          : undefined,
        endDate: filters.endDate
          ? new Date(`${filters.endDate}T23:59:59.999`).toISOString()
          : undefined,
      });
      setExpenses(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load expenses."));
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters, rangeInvalid]);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Applies new filters and returns to the first page.
  const handleFiltersChange = (next: ExpenseFilters) => {
    setFilters(next);
    setPage(1);
  };

  // Closes the create dialog, announces the new expense and reloads the list.
  const handleCreated = (expense: ExpenseDto) => {
    setCreateOpen(false);
    setNotice(`Expense #${expense.id} recorded.`);
    if (page === 1) loadExpenses();
    else setPage(1);
  };

  // Fetches the latest copy of an expense, then opens the edit dialog.
  const handleEditRequest = async (expense: ExpenseDto) => {
    setFetchingId(expense.id);
    setError(null);
    try {
      setEditTarget(await fetchExpenseDetail(expense.id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load the expense."));
      if (isExpenseNotFound(err)) loadExpenses();
    } finally {
      setFetchingId(null);
    }
  };

  // Closes the edit dialog, announces the update and reloads the list.
  const handleUpdated = (expense: ExpenseDto) => {
    setEditTarget(null);
    setNotice(`Expense #${expense.id} updated.`);
    loadExpenses();
  };

  // Closes a dialog for an expense that no longer exists, shows why and reloads the list.
  const handleMissing = (message: string) => {
    setEditTarget(null);
    setDeleteTarget(null);
    setError(message);
    loadExpenses();
  };

  // Closes the delete dialog, announces the result and reloads (or steps back a page).
  const handleDeleted = (expense: ExpenseDto) => {
    setDeleteTarget(null);
    setNotice(`Expense #${expense.id} deleted.`);
    if (expenses.length === 1 && page > 1) setPage(page - 1);
    else loadExpenses();
  };

  return (
    <div className="flex-1 space-y-6 font-sans">
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        <PageHeader
          header="Expenses"
          subheader="Record store operating expenses and review them by category, date range and payment method."
        />

        <Button
          onClick={() => setCreateOpen(true)}
          className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Expense
        </Button>
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-start">
          <ExpenseFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={loadExpenses}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {notice}
            </span>
            <Button variant="ghost" size="xs" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {error && (
          <div className="break-words rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <ExpenseTable
          expenses={expenses}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          fetchingId={fetchingId}
          onPageChange={setPage}
          onEdit={handleEditRequest}
          onDelete={setDeleteTarget}
        />
      </div>

      {createOpen && (
        <CreateExpenseModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {editTarget && (
        <EditExpenseModal
          expense={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
          onMissing={handleMissing}
        />
      )}

      {deleteTarget && (
        <DeleteExpenseDialog
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
          onMissing={handleMissing}
        />
      )}
    </div>
  );
}
