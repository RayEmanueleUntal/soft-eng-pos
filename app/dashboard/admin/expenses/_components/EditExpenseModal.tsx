// Dialog for editing an existing operating expense in the POS admin Expenses page.
// Prefills from the freshly fetched expense and sends only the changed fields via PATCH /expenses/{id}.
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
import { isExpenseNotFound, updateExpense } from "@/lib/admin/expense-api";
import { ExpenseDto, UpdateExpensePayload } from "@/lib/admin/expense-types";
import { getErrorMessage } from "@/lib/utils";
import {
  dateInputToIso,
  ExpenseFormFields,
  ExpenseFormValues,
  isoToDateInput,
  validateAmount,
} from "./ExpenseFormFields";

interface EditExpenseModalProps {
  expense: ExpenseDto;
  onClose: () => void;
  onUpdated: (expense: ExpenseDto) => void;
  onMissing: (message: string) => void;
}

// Builds the form values from the stored expense.
function toFormValues(expense: ExpenseDto): ExpenseFormValues {
  return {
    amount: String(expense.amount),
    category: expense.category,
    payment_method: expense.payment_method,
    date: isoToDateInput(expense.date),
    notes: expense.notes ?? "",
  };
}

// Compares the form with the stored expense and returns only the changed fields.
function buildChanges(
  expense: ExpenseDto,
  values: ExpenseFormValues,
): UpdateExpensePayload {
  const initial = toFormValues(expense);
  const changes: UpdateExpensePayload = {};

  if (Number(values.amount) !== expense.amount) {
    changes.amount = Number(values.amount);
  }
  if (values.category && values.category !== initial.category) {
    changes.category = values.category;
  }
  if (values.payment_method !== initial.payment_method) {
    changes.payment_method = values.payment_method;
  }
  if (values.date && values.date !== initial.date) {
    changes.date = dateInputToIso(values.date);
  }
  if (values.notes.trim() !== initial.notes.trim()) {
    changes.notes = values.notes.trim();
  }
  return changes;
}

// Renders the edit form for one expense and submits the changes.
export function EditExpenseModal({
  expense,
  onClose,
  onUpdated,
  onMissing,
}: EditExpenseModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() =>
    toFormValues(expense),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountError = validateAmount(values.amount);

  // Validates, then patches the changed fields and reports the updated expense.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (amountError) return;

    const changes = buildChanges(expense, values);
    if (Object.keys(changes).length === 0) {
      setError("No changes to save.");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await updateExpense(expense.id, changes);
      onUpdated(updated);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to update the expense.");
      if (isExpenseNotFound(err)) {
        onMissing(message);
        return;
      }
      setError(message);
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
            Edit Expense{" "}
            <span className="font-mono text-base">#{expense.id}</span>
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Update the expense details or notes. Only changed fields are saved.
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
            idPrefix="edit-expense"
            values={values}
            amountError={amountError}
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
