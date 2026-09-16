"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GCashPaymentFormProps {
  amountDue?: number;
  onPaymentChange: (details: {
    type: string;
    amount: number;
    referenceNumber: string;
    mobileNumber: string;
    isValid?: boolean;
    errorMessage?: string;
  }) => void;
}

export default function GCashPaymentForm({ amountDue, onPaymentChange }: GCashPaymentFormProps) {
  const [amount, setAmount] = useState<number | "">(amountDue ?? "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [touched, setTouched] = useState({ ref: false, mobile: false });

  // If amountDue changes from props, update amount
  useEffect(() => {
    if (amountDue !== undefined && amount === "") {
      setAmount(amountDue);
    }
  }, [amountDue, amount]);

  // Validation rules
  const trimmedRef = referenceNumber.trim();
  const trimmedMobile = mobileNumber.trim();

  const isRefValid = trimmedRef.length >= 6;
  // Validates Philippine mobile number: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX
  const mobileRegex = /^(09\d{9}|\+639\d{9})$/;
  const isMobileValid = mobileRegex.test(trimmedMobile);
  const isAmountValid = typeof amount === "number" && amount > 0;

  let errorMessage = "";
  if (!isAmountValid) {
    errorMessage = "Valid GCash payment amount is required.";
  } else if (!isRefValid) {
    errorMessage = "GCash Reference Number is required (at least 6 digits).";
  } else if (!isMobileValid) {
    errorMessage = "A valid 11-digit GCash mobile number (09XXXXXXXXX) is required.";
  }

  const isValid = isAmountValid && isRefValid && isMobileValid;

  useEffect(() => {
    onPaymentChange({
      type: "GCASH",
      amount: amount === "" ? 0 : amount,
      referenceNumber: trimmedRef,
      mobileNumber: trimmedMobile,
      isValid,
      errorMessage: errorMessage || undefined,
    });
  }, [amount, trimmedRef, trimmedMobile, isValid, errorMessage, onPaymentChange]);

  return (
    <div className="space-y-4 py-4">
      {/* Amount Field */}
      <div className="grid gap-1.5">
        <Label htmlFor="gcash-amount">Amount Paid via GCash (₱)</Label>
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
        />
        {amountDue !== undefined && typeof amount === "number" && amount < amountDue && (
          <p className="text-xs text-amber-600">
            Note: Entered amount is less than total due (₱{amountDue.toFixed(2)}).
          </p>
        )}
      </div>

      {/* Reference Number Field */}
      <div className="grid gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gcash-ref">GCash Reference Number *</Label>
          <span className="text-[11px] text-muted-foreground/80">From customer receipt</span>
        </div>
        <Input
          id="gcash-ref"
          type="text"
          placeholder="e.g. 100029384758"
          value={referenceNumber}
          onBlur={() => setTouched((prev) => ({ ...prev, ref: true }))}
          onChange={(e) => setReferenceNumber(e.target.value)}
          className={touched.ref && !isRefValid ? "border-red-500" : ""}
        />
        {touched.ref && !isRefValid && (
          <p className="text-xs text-destructive">
            Reference Number is required (min 6 alphanumeric characters).
          </p>
        )}
      </div>

      {/* Mobile Number Field */}
      <div className="grid gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gcash-mobile">GCash Mobile Number *</Label>
          <span className="text-[11px] text-muted-foreground/80">09XXXXXXXXX</span>
        </div>
        <Input
          id="gcash-mobile"
          type="tel"
          maxLength={11}
          placeholder="09171234567"
          value={mobileNumber}
          onBlur={() => setTouched((prev) => ({ ...prev, mobile: true }))}
          onChange={(e) => {
            // Keep only numbers
            const clean = e.target.value.replace(/\D/g, "");
            setMobileNumber(clean);
          }}
          className={touched.mobile && !isMobileValid ? "border-red-500" : ""}
        />
        {touched.mobile && !isMobileValid && (
          <p className="text-xs text-destructive">
            Enter a valid 11-digit mobile number starting with 09.
          </p>
        )}
      </div>
    </div>
  );
}