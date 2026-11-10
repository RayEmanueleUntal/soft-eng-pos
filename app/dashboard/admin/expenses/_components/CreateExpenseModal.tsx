// Dialog for recording a new operating expense in the POS admin Expenses page.
// Validates the amount live, then sends POST /expenses; the backend attaches the logged-in staff.
// Mounted by /dashboard/admin/expenses only while open, so its state is fresh each time.
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
import { createExpense } from "@/lib/admin/expense-api";
import { ExpenseDto } from "@/lib/admin/expense-types";
import { getErrorMessage } from "@/lib/utils";
import {
  dateInputToIso,
  EMPTY_EXPENSE_FORM,
  ExpenseFormFields,
  ExpenseFormValues,
  validateAmount,
} from "./ExpenseFormFields";

interface CreateExpenseModalProps {
  onClose: () => void;
  onCreated: (expense: ExpenseDto) => void;
}

// Renders the create form and submits it when the input is valid.
export function CreateExpenseModal({
  onClose,
  onCreated,
}: CreateExpenseModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_EXPENSE_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountError =
    values.amount !== "" || submitted ? validateAmount(values.amount) : "";
  const categoryError =
    submitted && !values.category ? "Category is required." : "";

  // Validates, then creates the expense and reports it to the page.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (validateAmount(values.amount) || !values.category) return;

    try {
      setSubmitting(true);
      const notes = values.notes.trim();
      const created = await createExpense({
        category: values.category,
        amount: Number(values.amount),
        payment_method: values.payment_method,
        date: dateInputToIso(values.date),
        notes: notes || undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to record the expense."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[4px] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold text-foreground tracking-tight">
            New Expense
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Record a store operating expense. It is logged under your account.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 text-xs font-sans p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[2px] mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <ExpenseFormFields
            idPrefix="create-expense"
            values={values}
            amountError={amountError}
            categoryError={categoryError}
            disabled={submitting}
            onChange={setValues}
          />

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={onClose}
              className="rounded-[2px] h-8 text-xs font-sans border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="rounded-[2px] h-8 text-xs font-sans font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Saving..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
