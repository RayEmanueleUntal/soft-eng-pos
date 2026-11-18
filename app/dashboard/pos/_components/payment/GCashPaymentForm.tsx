"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GCashPaymentDetails {
  type: "GCASH";
  amount: number;
  referenceNumber: string;
  isValid?: boolean;
  errorMessage?: string;
}

interface GCashPaymentFormProps {
  amountDue?: number;
  onPaymentChange: (details: GCashPaymentDetails) => void;
}

export default function GCashPaymentForm({ amountDue, onPaymentChange }: GCashPaymentFormProps) {
  const [amount, setAmount] = useState<number | "">(amountDue ?? "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [touched, setTouched] = useState({ ref: false });

  const [prevAmountDue, setPrevAmountDue] = useState(amountDue);
  if (amountDue !== prevAmountDue) {
    setPrevAmountDue(amountDue);
    if (amount === "" || amount === prevAmountDue || (typeof amount === "number" && typeof amountDue === "number" && amount > amountDue)) {
      setAmount(amountDue ?? "");
    }
  }

  // Validation rules
  const trimmedRef = referenceNumber.trim();

  const isRefValid = trimmedRef.length >= 6;
  const isAmountValid = typeof amount === "number" && amount > 0;

  const isNotExceedingDue = amountDue === undefined || (typeof amount === "number" && amount <= amountDue + 0.001);

  let errorMessage = "";
  if (!isAmountValid) {
    errorMessage = "Valid GCash payment amount is required.";
  } else if (!isNotExceedingDue && amountDue !== undefined) {
    errorMessage = `GCash payment cannot exceed remaining due (₱${amountDue.toFixed(2)}).`;
  } else if (!isRefValid) {
    errorMessage = "InstaPay Reference Number is required (at least 6 digits).";
  }

  const isValid = isAmountValid && isNotExceedingDue && isRefValid;

  useEffect(() => {
    onPaymentChange({
      type: "GCASH",
      amount: amount === "" ? 0 : amount,
      referenceNumber: trimmedRef,
      isValid,
      errorMessage: errorMessage || undefined,
    });
  }, [amount, trimmedRef, isValid, errorMessage, onPaymentChange]);

  return (
    <div className="space-y-4 py-4">
      {/* Amount Field */}
      <div className="grid gap-1.5">
        <Label htmlFor="gcash-amount" className="font-sans text-xs font-semibold text-foreground">
          Amount Paid via InstaPay (₱)
        </Label>
        <Input
          id="gcash-amount"
          type="number"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value);
            setAmount(val);
          }}
          className="h-9 rounded-[4px] border-input font-mono text-sm"
        />
        {amountDue !== undefined && typeof amount === "number" && amount < amountDue && (
          <p className="text-xs font-sans text-amber-600">
            Note: Entered amount is less than total due (₱{amountDue.toFixed(2)}).
          </p>
        )}
      </div>

      {/* Reference Number Field */}
      <div className="grid gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gcash-ref" className="font-sans text-xs font-semibold text-foreground">
            InstaPay Reference Number <span className="text-destructive">*</span> 
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground">From customer receipt</span>
        </div>
        <Input
          id="gcash-ref"
          type="text"
          placeholder="e.g. 100029384758"
          value={referenceNumber}
          onBlur={() => setTouched((prev) => ({ ...prev, ref: true }))}
          onChange={(e) => setReferenceNumber(e.target.value)}
          className={`h-9 rounded-[4px] border-input font-mono text-sm ${touched.ref && !isRefValid ? "border-destructive text-destructive" : ""}`}
        />
        {touched.ref && !isRefValid && (
          <p className="text-xs font-sans text-destructive">
            Reference Number is required (min 6 alphanumeric characters).
          </p>
        )}
      </div>

    </div>
  );
}