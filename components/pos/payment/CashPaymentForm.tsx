"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CashPaymentDetails {
  type: "CASH";
  amount: number;
  cashTendered: number;
  changeDue?: number;
  isValid?: boolean;
  errorMessage?: string;
}

interface CashPaymentFormProps {
  amountDue: number;
  onPaymentChange: (details: CashPaymentDetails) => void;
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
      errorMessage: numValue < amountDue ? "Insufficient cash tendered." : undefined,
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
      <div className="grid gap-1.5">
        <Label htmlFor="cash-tendered" className="font-sans text-xs font-semibold text-foreground">
          Amount Tendered (₱)
        </Label>
        <Input
          id="cash-tendered"
          type="number"
          step="any"
          placeholder="0.00"
          value={cashTendered}
          onChange={handleCashChange}
          className={`h-9 rounded-[4px] border-input font-mono text-sm ${isShort ? "border-destructive text-destructive" : ""}`}
          autoFocus
        />
        {isShort && (
          <p className="text-xs font-sans text-destructive">Insufficient cash tendered.</p>
        )}
      </div>

      {/* Quick Cash Presets */}
      {quickPresets.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-sans font-medium text-muted-foreground">Quick Cash Tendered</span>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPresetCash(preset)}
                className={`text-xs px-2.5 py-1.5 rounded-[4px] border transition-colors font-mono tabular-nums ${
                  cashTendered === preset
                    ? "bg-accent border-primary text-primary font-bold shadow-sm"
                    : "bg-card border-border text-foreground hover:bg-muted hover:border-input"
                }`}
              >
                {preset === amountDue ? "Exact (₱" + preset.toFixed(2) + ")" : "₱" + preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center rounded-[4px] bg-muted/60 p-3 border border-border">
        <span className="font-heading font-semibold text-sm text-foreground">Change Due:</span>
        <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">₱{changeDue.toFixed(2)}</span>
      </div>
    </div>
  );
}