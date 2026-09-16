"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPeso } from "@/lib/pos/format-currency";
import {
  getWholesaleCustomers,
  type WholesaleCustomerCredit,
} from "@/lib/pos/mock-payment";
import { AlertCircle, Calendar, CheckCircle2, CreditCard, ShieldAlert } from "lucide-react";

export interface CreditPaymentDetails {
  type: "CREDIT";
  amount: number;
  customerId?: string;
  customerName?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  availableCredit?: number;
  dueDate?: string;
  poNumber?: string;
  isValid: boolean;
  errorMessage?: string;
}

interface CreditPaymentFormProps {
  amountDue: number;
  initialCustomerId?: string;
  onPaymentChange: (details: CreditPaymentDetails) => void;
}

/** Formats a Date object to YYYY-MM-DD for input[type="date"] */
function formatDateToInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Adds given days to today and returns YYYY-MM-DD */
function getFutureDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDateToInput(d);
}

export default function CreditPaymentForm({
  amountDue,
  initialCustomerId,
  onPaymentChange,
}: CreditPaymentFormProps) {
  const [wholesaleCustomers] = useState<WholesaleCustomerCredit[]>(getWholesaleCustomers());
  
  // Default to first active wholesale customer or initialCustomerId if provided
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (initialCustomerId) return initialCustomerId;
    const firstActive = wholesaleCustomers.find((c) => c.isActive);
    return firstActive ? firstActive.id : wholesaleCustomers[0]?.id || "";
  });

  // Default payment due date to Net 30
  const [dueDate, setDueDate] = useState<string>(() => getFutureDateString(30));
  const [selectedTermDays, setSelectedTermDays] = useState<number | null>(30);
  const [poNumber, setPoNumber] = useState("");

  const selectedCustomer = wholesaleCustomers.find((c) => c.id === selectedCustomerId);

  // Available credit calculation: credit_limit - outstanding_balance
  const creditLimit = selectedCustomer?.credit_limit ?? 0;
  const outstandingBalance = selectedCustomer?.outstanding_balance ?? 0;
  const availableCredit = selectedCustomer ? Math.max(creditLimit - outstandingBalance, 0) : 0;
  const remainingCreditAfterPurchase = availableCredit - amountDue;

  // Validation rules
  const isInactive = selectedCustomer ? !selectedCustomer.isActive : false;
  const isExceeded = selectedCustomer ? amountDue > availableCredit : true;
  const isDateInvalid = !dueDate || new Date(dueDate) < new Date(formatDateToInput(new Date()));

  let errorMessage = "";
  if (!selectedCustomer) {
    errorMessage = "Please select a wholesale customer.";
  } else if (isInactive) {
    errorMessage = "Selected wholesale account is inactive. Credit sales disabled.";
  } else if (isExceeded) {
    errorMessage = `Insufficient available credit (₱${availableCredit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}). Transaction exceeds limit.`;
  } else if (isDateInvalid) {
    errorMessage = "Due date must be today or in the future.";
  }

  const isValid = !errorMessage;

  // Notify parent modal whenever state updates
  useEffect(() => {
    onPaymentChange({
      type: "CREDIT",
      amount: amountDue,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      creditLimit,
      outstandingBalance,
      availableCredit,
      dueDate,
      poNumber: poNumber.trim() || undefined,
      isValid,
      errorMessage: errorMessage || undefined,
    });
  }, [
    selectedCustomerId,
    dueDate,
    poNumber,
    amountDue,
    isValid,
    errorMessage,
    creditLimit,
    outstandingBalance,
    availableCredit,
    selectedCustomer,
    onPaymentChange,
  ]);

  const handleTermPreset = (days: number) => {
    setSelectedTermDays(days);
    setDueDate(getFutureDateString(days));
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    setSelectedTermDays(null);
  };

  const creditUsagePercent = creditLimit > 0
    ? Math.min(Math.round(((outstandingBalance + amountDue) / creditLimit) * 100), 100)
    : 0;

  return (
    <div className="space-y-4 py-3">
      {/* Customer Selection */}
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="wholesale-customer" className="font-semibold text-foreground">
            Wholesale Customer Account
          </Label>
          {selectedCustomer && (
            <Badge variant={selectedCustomer.isActive ? "default" : "destructive"} className="text-xs">
              {selectedCustomer.isActive ? "Active Account" : "Account Inactive"}
            </Badge>
          )}
        </div>

        <select
          id="wholesale-customer"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {wholesaleCustomers.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.isActive}>
              {c.name} {c.isActive ? "" : "(Inactive)"} - Avail: {formatPeso(c.available_credit)}
            </option>
          ))}
        </select>
      </div>

      {/* Credit Balance Card */}
      {selectedCustomer && (
        <div className={`rounded-lg border p-3.5 space-y-3 transition-colors ${
          isExceeded || isInactive
            ? "bg-destructive/10 border-destructive/30"
            : "bg-muted border-border"
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground border-b pb-2">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Accounts Receivable Status
            </span>
            <span className="text-foreground">{selectedCustomer.contactInfo}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Credit Limit</p>
              <p className="font-semibold text-foreground">{formatPeso(creditLimit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              <p className="font-semibold text-amber-700">{formatPeso(outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available Credit</p>
              <p className={`font-bold ${availableCredit >= amountDue ? "text-green-600" : "text-destructive"}`}>
                {formatPeso(availableCredit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining After Sale</p>
              <p className={`font-semibold ${remainingCreditAfterPurchase >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatPeso(remainingCreditAfterPurchase)}
              </p>
            </div>
          </div>

          {/* Credit Limit Warning */}
          {isExceeded && (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 p-2 rounded">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Credit limit exceeded by {formatPeso(amountDue - availableCredit)}. Cannot process credit payment.</span>
            </div>
          )}

          {isInactive && (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 p-2 rounded">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>This wholesale account is inactive. Please settle past obligations first.</span>
            </div>
          )}

          {/* Utilization indicator */}
          {!isExceeded && !isInactive && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Credit Utilization</span>
                <span>{creditUsagePercent}% of limit</span>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    creditUsagePercent > 85 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Due Date Setting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="due-date" className="font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Payment Due Date
          </Label>
          <span className="text-xs text-muted-foreground">Quick Terms</span>
        </div>

        {/* Quick Terms Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { days: 15, label: "Net 15" },
            { days: 30, label: "Net 30" },
            { days: 60, label: "Net 60" },
          ].map((term) => (
            <button
              key={term.days}
              type="button"
              onClick={() => handleTermPreset(term.days)}
              className={`text-xs py-1.5 px-3 rounded-md border font-medium transition-colors ${
                selectedTermDays === term.days
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              {term.label}
            </button>
          ))}
        </div>

        {/* Custom Due Date Input */}
        <Input
          id="due-date"
          type="date"
          min={formatDateToInput(new Date())}
          value={dueDate}
          onChange={handleCustomDateChange}
          className={isDateInvalid ? "border-red-500" : ""}
        />
        {isDateInvalid && (
          <p className="text-xs text-destructive">Please choose a valid future payment due date.</p>
        )}
      </div>

      {/* PO / Reference Number (Optional) */}
      <div className="grid gap-1.5">
        <Label htmlFor="po-number" className="text-xs text-muted-foreground">
          Purchase Order (PO) / Credit Ref # <span className="text-muted-foreground/80">(Optional)</span>
        </Label>
        <Input
          id="po-number"
          type="text"
          placeholder="e.g. PO-2026-0881"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
        />
      </div>
    </div>
  );
}

