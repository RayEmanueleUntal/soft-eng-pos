// Delete confirmation dialog for the admin Expenses page of the POS system.
// Calls DELETE /expenses/{id}; a 404 means the expense is already gone, so the page just refreshes.
// Mounted by /dashboard/admin/expenses only while open.
"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteExpense, isExpenseNotFound } from "@/lib/admin/expense-api";
import {
  EXPENSE_CATEGORY_LABELS,
  ExpenseDto,
} from "@/lib/admin/expense-types";
import { formatPeso, getErrorMessage } from "@/lib/utils";

interface DeleteExpenseDialogProps {
  expense: ExpenseDto;
  onClose: () => void;
  onDeleted: (expense: ExpenseDto) => void;
  onMissing: (message: string) => void;
}

// Renders the delete confirmation for one expense and performs the request when confirmed.
export function DeleteExpenseDialog({
  expense,
  onClose,
  onDeleted,
  onMissing,
}: DeleteExpenseDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Deletes the expense and reports the outcome to the page.
  async function handleDelete() {
    try {
      setDeleting(true);
      setError("");
      await deleteExpense(expense.id);
      onDeleted(expense);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to delete the expense.");
      if (isExpenseNotFound(err)) {
        onMissing(message);
        return;
      }
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[460px] bg-card border-border rounded-[4px] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold text-foreground tracking-tight">
            Delete Expense
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Are you sure you want to delete this{" "}
            <span className="font-semibold text-foreground">
              {EXPENSE_CATEGORY_LABELS[expense.category]}
            </span>{" "}
            expense of{" "}
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {formatPeso(Number(expense.amount))}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="text-xs font-sans p-3 bg-muted border border-border text-foreground rounded-[2px]">
          This removes the expense permanently. This cannot be undone.
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs font-sans p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[2px]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={onClose}
            className="rounded-[2px] h-8 text-xs font-sans border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
            className="rounded-[2px] h-8 text-xs font-sans font-semibold gap-1.5"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? "Deleting..." : "Delete Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
