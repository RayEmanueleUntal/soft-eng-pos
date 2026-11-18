// Paginated expenses table for the admin Expenses page of the POS system.
// Shows date, category, payment method, amount, logging staff and notes, with Edit/Delete row actions.
// Used only by /dashboard/admin/expenses.
"use client";

import { Loader2, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { TablePagination } from "@/components/ui/table-pagination";

const COLUMN_COUNT = 7;

const HEAD_CLASS =
  "text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold";

function getPaymentBadgeVariant(method: string) {
  switch (method) {
    case "CASH":
      return "default" as const;
    case "GCASH":
    case "CHECK":
    case "BANK_TRANSFER":
      return "secondary" as const;
    case "CREDIT":
      return "outline" as const;
    default:
      return "default" as const;
  }
}

interface ExpenseTableProps {
  expenses: ExpenseDto[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
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
  pageSize,
  fetchingId,
  onPageChange,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[4px] border border-input bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <Table>
          <TableHeader className="bg-muted border-b border-border">
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
                  className="py-8 text-center text-muted-foreground text-xs font-sans"
                >
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-8 text-center text-muted-foreground text-xs font-sans"
                >
                  No expenses found. Use &quot;New Expense&quot; to record one.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="h-[36px] border-b border-border hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors"
                >
                  <TableCell className="font-mono text-xs tabular-nums text-foreground whitespace-nowrap">
                    {formatExpenseDate(expense.date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-foreground text-xs font-sans">
                    {EXPENSE_CATEGORY_LABELS[expense.category] ??
                      expense.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      variant={getPaymentBadgeVariant(expense.payment_method)}
                      className="rounded-[2px] font-mono text-[11px] font-semibold uppercase"
                    >
                      {expense.payment_method.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs tabular-nums text-foreground whitespace-nowrap">
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
                  <TableCell className="max-w-[260px] whitespace-normal break-words text-muted-foreground text-xs font-sans">
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

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="expenses"
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
