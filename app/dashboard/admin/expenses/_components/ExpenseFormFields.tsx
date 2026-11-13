// Shared form fields, validation and date helpers for the admin Expenses create/edit modals.
// Amount is validated as a positive decimal (max 2 places); date is optional and sent as local noon.
// Used only by CreateExpenseModal and EditExpenseModal on /dashboard/admin/expenses.
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/admin/expense-types";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/analytics/types";

const FIELD_CLASS =
  "rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary";

const AMOUNT_PATTERN = /^\d*(\.\d{1,2})?$/;

export interface ExpenseFormValues {
  amount: string;
  category: ExpenseCategory | "";
  payment_method: PaymentMethod;
  date: string;
  notes: string;
}

export const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  amount: "",
  category: "",
  payment_method: "CASH",
  date: "",
  notes: "",
};

// Returns a validation message for the amount, or an empty string when it is valid.
export function validateAmount(raw: string): string {
  const value = raw.trim();
  if (!value) return "Amount is required.";
  if (Number.isNaN(Number(value))) return "Amount must be a number.";
  if (Number(value) <= 0) return "Amount must be greater than 0.";
  if (!AMOUNT_PATTERN.test(value)) {
    return "Use at most 2 decimal places, for example 2500.50.";
  }
  return "";
}

// Converts a YYYY-MM-DD input value to an ISO datetime at local noon; empty stays undefined.
export function dateInputToIso(value: string): string | undefined {
  return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
}

// Converts an ISO datetime to the local YYYY-MM-DD value used by date inputs.
export function isoToDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

interface ExpenseFormFieldsProps {
  idPrefix: string;
  values: ExpenseFormValues;
  amountError: string;
  categoryError?: string;
  disabled?: boolean;
  onChange: (values: ExpenseFormValues) => void;
}

// Renders the amount, category, payment method, date and notes inputs.
export function ExpenseFormFields({
  idPrefix,
  values,
  amountError,
  categoryError = "",
  disabled = false,
  onChange,
}: ExpenseFormFieldsProps) {
  const labelClass = "text-xs font-sans font-medium text-foreground";

  return (
    <div className="grid gap-3 py-4">
      <div className="grid gap-1.5">
        <label htmlFor={`${idPrefix}-amount`} className={labelClass}>
          Amount (PHP) <span className="text-destructive">*</span> 
        </label>
        <Input
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="2500.50"
          value={values.amount}
          disabled={disabled}
          aria-invalid={amountError ? true : undefined}
          onChange={(e) => onChange({ ...values, amount: e.target.value })}
          className={`h-8 font-mono tabular-nums ${FIELD_CLASS}`}
        />
        {amountError && (
          <p className="text-xs text-destructive">{amountError}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className={labelClass}>Category <span className="text-destructive">*</span></span>
          <Select
            value={values.category || null}
            disabled={disabled}
            onValueChange={(value) =>
              onChange({
                ...values,
                category: (value ?? "") as ExpenseCategory | "",
              })
            }
          >
            <SelectTrigger className={`h-8 w-full ${FIELD_CLASS}`}>
              <SelectValue placeholder="Select category">
                {(value: string | null) =>
                  value
                    ? EXPENSE_CATEGORY_LABELS[value as ExpenseCategory]
                    : "Select category"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {EXPENSE_CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryError && (
            <p className="text-xs text-destructive">{categoryError}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <span className={labelClass}>Payment method</span>
          <Select
            value={values.payment_method}
            disabled={disabled}
            onValueChange={(value) =>
              onChange({
                ...values,
                payment_method: (value ?? "CASH") as PaymentMethod,
              })
            }
          >
            <SelectTrigger className={`h-8 w-full ${FIELD_CLASS}`}>
              <SelectValue>
                {(value: string) => value.replace(/_/g, " ")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={`${idPrefix}-date`} className={labelClass}>
          Date <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={values.date}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, date: e.target.value })}
          className={`h-8 font-mono ${FIELD_CLASS}`}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={`${idPrefix}-notes`} className={labelClass}>
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id={`${idPrefix}-notes`}
          rows={3}
          placeholder="Meralco bill for October"
          value={values.notes}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, notes: e.target.value })}
          className={`min-h-[72px] break-words ${FIELD_CLASS}`}
        />
      </div>
    </div>
  );
}
