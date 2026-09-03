"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GCashPaymentFormProps {
  onPaymentChange: (details: { type: string; amount: number; referenceNumber: string; mobileNumber: string }) => void;
}

export default function GCashPaymentForm({ onPaymentChange }: GCashPaymentFormProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const triggerUpdate = (newAmount: number | "", newRef: string, newMobile: string) => {
    onPaymentChange({
      type: "GCASH",
      amount: newAmount === "" ? 0 : newAmount,
      referenceNumber: newRef,
      mobileNumber: newMobile,
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="gcash-amount">Amount Paid via GCash (₱)</Label>
        <Input
          id="gcash-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value);
            setAmount(val);
            triggerUpdate(val, referenceNumber, mobileNumber);
          }}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gcash-ref">Reference Number</Label>
        <Input
          id="gcash-ref"
          type="text"
          placeholder="e.g. 100029384758"
          value={referenceNumber}
          onChange={(e) => {
            setReferenceNumber(e.target.value);
            triggerUpdate(amount, e.target.value, mobileNumber);
          }}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gcash-mobile">GCash Mobile Number</Label>
        <Input
          id="gcash-mobile"
          type="text"
          placeholder="09XXXXXXXXX"
          value={mobileNumber}
          onChange={(e) => {
            setMobileNumber(e.target.value);
            triggerUpdate(amount, referenceNumber, e.target.value);
          }}
        />
      </div>
    </div>
  );
}