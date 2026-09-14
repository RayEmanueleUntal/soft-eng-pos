"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CashPaymentFormProps {
  amountDue: number;
  onPaymentChange: (details: {
    type: string;
    amount: number;
    cashTendered: number;
    changeDue?: number;
    isValid?: boolean;
  }) => void;
}

export default function CashPaymentForm({ amountDue, onPaymentChange }: CashPaymentFormProps) {
  const [cashTendered, setCashTendered] = useState<number | "">("");

  const updateCash = (value: number | "") => {
    setCashTendered(value);
    const numValue = value === "" ? 0 : value;
    const isValid = numValue >= amountDue && amountDue > 0;
    const change = Math.max(numValue - amountDue, 0);

    // Send cash details up to the main modal so it knows how much is paid
    onPaymentChange({
      type: "CASH",
      amount: amountDue,
      cashTendered: numValue,
      changeDue: change,
      isValid,
    });
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? "" : Number(e.target.value);
    updateCash(value);
  };

  const setPresetCash = (val: number) => {
    updateCash(val);
  };

  const changeDue = typeof cashTendered === "number" ? Math.max(cashTendered - amountDue, 0) : 0;
  const isShort = typeof cashTendered === "number" && cashTendered < amountDue;

  // Generate quick cash suggestions
  const roundedNext100 = Math.ceil(amountDue / 100) * 100;
  const roundedNext500 = Math.ceil(amountDue / 500) * 500;
  const roundedNext1000 = Math.ceil(amountDue / 1000) * 1000;

  const quickPresets = Array.from(
    new Set([
      amountDue,
      roundedNext100 !== amountDue ? roundedNext100 : null,
      roundedNext500 !== roundedNext100 ? roundedNext500 : null,
      roundedNext1000 !== roundedNext500 ? roundedNext1000 : null,
    ].filter((v): v is number => v !== null && v > 0))
  );

  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="cash-tendered">Amount Tendered (₱)</Label>
        <Input
          id="cash-tendered"
          type="number"
          step="any"
          placeholder="0.00"
          value={cashTendered}
          onChange={handleCashChange}
          className={isShort ? "border-red-500" : ""}
          autoFocus
        />
        {isShort && (
          <p className="text-sm text-red-500">Insufficient cash tendered.</p>
        )}
      </div>

      {/* Quick Cash Presets */}
      {quickPresets.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-gray-500">Quick Cash Tendered</span>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPresetCash(preset)}
                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                  cashTendered === preset
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {preset === amountDue ? "Exact (₱" + preset.toFixed(2) + ")" : "₱" + preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center rounded-lg bg-gray-50 p-4 border">
        <span className="font-medium text-gray-700">Change Due:</span>
        <span className="text-xl font-bold text-green-600">₱{changeDue.toFixed(2)}</span>
      </div>
    </div>
  );
}