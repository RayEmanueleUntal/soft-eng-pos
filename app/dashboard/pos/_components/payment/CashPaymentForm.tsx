"use client";

import { useState, useEffect } from "react";
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
  const [amountToApply, setAmountToApply] = useState<number | "">(amountDue);
  const [cashTendered, setCashTendered] = useState<number | "">("");

  // Sync with dynamic remainingDue changes from parent
  const [prevAmountDue, setPrevAmountDue] = useState(amountDue);
  if (amountDue !== prevAmountDue) {
    setPrevAmountDue(amountDue);
    if (amountToApply === "" || amountToApply === prevAmountDue || amountToApply > amountDue) {
      setAmountToApply(amountDue);
    }
  }

  const effectiveAmount = typeof amountToApply === "number" && amountToApply > 0 ? amountToApply : 0;
  const numTendered = typeof cashTendered === "number" ? cashTendered : 0;
  const isAmountValid = effectiveAmount > 0 && effectiveAmount <= amountDue;
  const isTenderValid = typeof cashTendered === "number" && numTendered >= effectiveAmount;
  const isValid = isAmountValid && isTenderValid;
  const changeDue = isTenderValid ? Math.max(numTendered - effectiveAmount, 0) : 0;
  const isShort = typeof cashTendered === "number" && numTendered < effectiveAmount;

  // Notify parent modal whenever values change
  useEffect(() => {
    let errorMessage: string | undefined;
    if (!isAmountValid) {
      errorMessage = "Amount to apply must be between ₱0.01 and ₱" + amountDue.toFixed(2);
    } else if (isShort) {
      errorMessage = "Insufficient cash tendered.";
    }

    onPaymentChange({
      type: "CASH",
      amount: effectiveAmount,
      cashTendered: numTendered,
      changeDue,
      isValid,
      errorMessage,
    });
  }, [effectiveAmount, numTendered, changeDue, isValid, isShort, amountDue, onPaymentChange]);

  const setPresetCash = (val: number) => {
    setCashTendered(val);
  };

  // Generate quick cash suggestions based on amountToApply
  const targetForPresets = effectiveAmount > 0 ? effectiveAmount : amountDue;
  const roundedNext100 = Math.ceil(targetForPresets / 100) * 100;
  const roundedNext500 = Math.ceil(targetForPresets / 500) * 500;
  const roundedNext1000 = Math.ceil(targetForPresets / 1000) * 1000;

  const quickPresets = Array.from(
    new Set([
      targetForPresets,
      roundedNext100 !== targetForPresets ? roundedNext100 : null,
      roundedNext500 !== roundedNext100 ? roundedNext500 : null,
      roundedNext1000 !== roundedNext500 ? roundedNext1000 : null,
    ].filter((v): v is number => v !== null && v > 0))
  );

  return (
    <div className="space-y-4 py-4">
      {/* 1. Cash Amount to Apply (allows split payments) */}
      <div className="grid gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="cash-amount" className="font-sans text-xs font-semibold text-foreground">
            Cash Amount to Apply (₱)
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground">
            Max: ₱{amountDue.toFixed(2)}
          </span>
        </div>
        <Input
          id="cash-amount"
          type="number"
          step="any"
          placeholder="0.00"
          value={amountToApply}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value);
            setAmountToApply(val);
          }}
          className="h-9 rounded-[4px] border-input font-mono text-sm"
        />
        {typeof amountToApply === "number" && amountToApply < amountDue && amountToApply > 0 && (
          <p className="text-[11px] font-sans text-muted-foreground">
            Split Payment: Remaining ₱{(amountDue - amountToApply).toFixed(2)} can be paid via GCash or Credit.
          </p>
        )}
      </div>

      {/* 2. Amount Tendered by Customer */}
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
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value);
            setCashTendered(val);
          }}
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
                {preset === targetForPresets ? "Exact (₱" + preset.toFixed(2) + ")" : "₱" + preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Change Due Display */}
      <div className="flex justify-between items-center rounded-[4px] bg-muted/60 p-3 border border-border">
        <span className="font-heading font-semibold text-sm text-foreground">Change Due:</span>
        <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
          ₱{changeDue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
