"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  formatPeso,
  usePosCustomers,
  type WholesaleCustomerCredit,
} from "@/lib/pos";
import { AlertCircle, Calendar, CreditCard, ShieldAlert } from "lucide-react";

export interface CreditPaymentDetails {
  type: "CREDIT";
  amount: number;
  customerId?: string | number;
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
  initialCustomerId?: string | number;
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
  const { customers, loading: isCustomersLoading } = usePosCustomers();

  // Filter real customers who are wholesale or have credit lines
  const wholesaleCustomers: WholesaleCustomerCredit[] = useMemo(() => {
    return customers
      .filter((c) => c.type === "WHOLESALE" || c.creditLimit > 0)
      .map((c) => ({
        id: String(c.id),
        name: c.companyName ? `${c.name} (${c.companyName})` : c.name,
        contactInfo: c.contactNumber,
        credit_limit: c.creditLimit,
        outstanding_balance: c.outstandingBalance,
        available_credit: c.availableCredit,
        isActive: true,
      }));
  }, [customers]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return initialCustomerId ? String(initialCustomerId) : "";
  });

  const effectiveCustomerId =
    selectedCustomerId || (initialCustomerId ? String(initialCustomerId) : wholesaleCustomers[0]?.id || "");

  // Default payment due date to Net 30
  const [dueDate, setDueDate] = useState<string>(() => getFutureDateString(30));
  const [selectedTermDays, setSelectedTermDays] = useState<number | null>(30);
  const [poNumber, setPoNumber] = useState("");

  const selectedCustomer = wholesaleCustomers.find((c) => c.id === effectiveCustomerId);

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
    errorMessage = isCustomersLoading ? "Loading accounts..." : "Please select a wholesale customer.";
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
    effectiveCustomerId,
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
          value={effectiveCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {isCustomersLoading ? (
            <option value="">Loading wholesale accounts...</option>
          ) : wholesaleCustomers.length === 0 ? (
            <option value="">No wholesale customer accounts found</option>
          ) : (
            wholesaleCustomers.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.isActive}>
                {c.name} {c.isActive ? "" : "(Inactive)"} - Avail: {formatPeso(c.available_credit)}
              </option>
            ))
          )}
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

          {/* Credit Limit Usage Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Credit Utilization (incl. current)</span>
              <span className={`font-medium ${creditUsagePercent >= 90 ? "text-destructive" : "text-foreground"}`}>
                {creditUsagePercent}%
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isExceeded
                    ? "bg-destructive"
                    : creditUsagePercent >= 80
                    ? "bg-amber-500"
                    : "bg-green-600"
                }`}
                style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Warning / Error Notifications */}
      {isInactive && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>This account has been flagged as inactive. Contact the manager or finance team to reactivate.</span>
        </div>
      )}

      {isExceeded && !isInactive && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Sale exceeds available credit by {formatPeso(Math.abs(remainingCreditAfterPurchase))}.
            Requires manager override or partial payment.
          </span>
        </div>
      )}

      {/* Payment Terms & Due Date */}
      <div className="space-y-2 pt-1">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Payment Terms
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Net 7", days: 7 },
            { label: "Net 15", days: 15 },
            { label: "Net 30", days: 30 },
            { label: "Net 60", days: 60 },
          ].map((term) => (
            <button
              key={term.days}
              type="button"
              onClick={() => handleTermPreset(term.days)}
              className={`py-1.5 text-xs rounded-md border transition-all ${
                selectedTermDays === term.days
                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                  : "bg-background hover:bg-muted text-foreground border-input"
              }`}
            >
              {term.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Due Date & PO Number Fields */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="grid gap-1.5">
          <Label htmlFor="due-date" className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Due Date
          </Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            min={formatDateToInput(new Date())}
            onChange={handleCustomDateChange}
            className={`text-sm ${isDateInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="po-number" className="text-xs text-muted-foreground">
            Customer PO # (Optional)
          </Label>
          <Input
            id="po-number"
            type="text"
            placeholder="e.g. PO-8921"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

