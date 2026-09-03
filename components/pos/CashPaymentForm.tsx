"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CashPaymentFormProps {
  amountDue: number;
  onPaymentChange: (details: { type: string; amount: number; cashTendered: number }) => void;
}

export default function CashPaymentForm({ amountDue, onPaymentChange }: CashPaymentFormProps) {
  const [cashTendered, setCashTendered] = useState<number | "">("");

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    setCashTendered(value);
    
    // Send cash details up to the main modal so it knows how much is paid
    onPaymentChange({
      type: "CASH",
      amount: value === "" ? 0 : Math.min(value, amountDue),
      cashTendered: value === "" ? 0 : value,
    });
  };

  const changeDue = typeof cashTendered === "number" ? Math.max(cashTendered - amountDue, 0) : 0;
  const isShort = typeof cashTendered === "number" && cashTendered < amountDue;

  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="cash-tendered">Amount Tendered (₱)</Label>
        <Input
          id="cash-tendered"
          type="number"
          placeholder="0.00"
          value={cashTendered}
          onChange={handleCashChange}
          className={isShort ? "border-red-500" : ""}
        />
        {isShort && (
            <p className="text-sm text-red-500">Insufficient cash tendered.</p>
        )}
      </div>

      <div className="flex justify-between items-center rounded-lg bg-gray-50 p-4 border">
        <span className="font-medium text-gray-700">Change Due:</span>
        <span className="text-xl font-bold text-green-600">₱{changeDue.toFixed(2)}</span>
      </div>
    </div>
  );
}