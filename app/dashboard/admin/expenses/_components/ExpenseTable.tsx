// Paginated expenses table for the admin Expenses page of the POS system.
// Shows date, category, payment method, amount, logging staff and notes, with Edit/Delete row actions.
// Used only by /dashboard/admin/expenses.
"use client";

import { Loader2, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EXPENSE_CATEGORY_LABELS,
  ExpenseDto,
} from "@/lib/admin/expense-types";
import { formatPeso } from "@/lib/utils";

const COLUMN_COUNT = 7;

const HEAD_CLASS =
  "text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9";

interface ExpenseTableProps {
  expenses: ExpenseDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  fetchingId: number | null;
  onPageChange: (page: number) => void;
  onEdit: (expense: ExpenseDto) => void;
  onDelete: (expense: ExpenseDto) => void;
}

// Formats an ISO datetime as a short local date.
function formatExpenseDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// Returns the logging staff member's full name, or a dash when the record has none.
function formatStaffName(expense: ExpenseDto): string {
  if (!expense.staff) return "—";
  const name = `${expense.staff.first_name} ${expense.staff.last_name}`.trim();
  return name || "—";
}

// Renders the expense rows with loading and empty states plus pagination controls.
export function ExpenseTable({
  expenses,
  loading,
  page,
  totalPages,
  total,
  fetchingId,
  onPageChange,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className={HEAD_CLASS}>Date</TableHead>
              <TableHead className={HEAD_CLASS}>Category</TableHead>
              <TableHead className={HEAD_CLASS}>Payment</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                Amount
              </TableHead>
              <TableHead className={HEAD_CLASS}>Logged by</TableHead>
              <TableHead className={HEAD_CLASS}>Notes</TableHead>
              <TableHead className={`${HEAD_CLASS} text-center`}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No expenses found. Use &quot;New Expense&quot; to record one.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="text-xs">
                  <TableCell className="font-mono tabular-nums whitespace-nowrap">
                    {formatExpenseDate(expense.date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {EXPENSE_CATEGORY_LABELS[expense.category] ??
                      expense.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {expense.payment_method.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground whitespace-nowrap">
                    {formatPeso(Number(expense.amount))}
                  </TableCell>
                  <TableCell>
                    <span
                      className="block max-w-[160px] truncate"
                      title={formatStaffName(expense)}
                    >
                      {formatStaffName(expense)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[260px] whitespace-normal break-words text-muted-foreground">
                    {expense.notes?.trim() ? expense.notes : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={fetchingId === expense.id}
                      onClick={() => onEdit(expense)}
                      title={`Edit expense #${expense.id}`}
                      className="h-7 w-7 rounded-[2px] hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      {fetchingId === expense.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <PencilIcon className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(expense)}
                      title={`Delete expense #${expense.id}`}
                      className="h-7 w-7 rounded-[2px] hover:bg-red-50 text-muted-foreground hover:text-red-700"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
        <div>
          Showing {expenses.length} of {total} records (Page {page} of{" "}
          {Math.max(totalPages, 1)})
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="font-sans"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="font-sans"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
