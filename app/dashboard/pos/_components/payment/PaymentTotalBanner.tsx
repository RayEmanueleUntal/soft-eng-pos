"use client";

import { formatPeso } from "@/lib/pos";
import type { PaymentModalCustomer } from "@/lib/pos";
import { User, Receipt as ReceiptIcon } from "lucide-react";

interface PaymentTotalBannerProps {
  cartTotal: number;
  paidAmount?: number;
  remainingDue?: number;
  customer?: PaymentModalCustomer | null;
}

export function PaymentTotalBanner({
  cartTotal,
  paidAmount = 0,
  remainingDue,
  customer,
}: PaymentTotalBannerProps) {
  const currentRemaining =
    remainingDue !== undefined ? remainingDue : Math.max(0, cartTotal - paidAmount);
  const hasSplit = paidAmount > 0;

  return (
    <div className="rounded-[4px] bg-primary text-white p-4 my-2 shadow-[0px_4px_0px_rgba(0,96,178,0.2)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-white/80">
            <ReceiptIcon className="h-3.5 w-3.5 text-white" />
            <span>{hasSplit ? "Grand Total" : "Total Amount Due"}</span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight font-heading tabular-nums">
            {formatPeso(cartTotal)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/90">
            <User className="h-3.5 w-3.5 text-white/80" />
            <span>Customer:</span>
            {customer ? (
              <span className="font-semibold text-white">
                {customer.name}{" "}
                <span className="font-normal text-white/80 font-mono text-[11px]">
                  ({customer.type || "Retail"})
                </span>
              </span>
            ) : (
              <span className="font-medium text-white">
                Walk-in Customer <span className="font-mono text-[11px] text-white/80">(Retail)</span>
              </span>
            )}
          </div>
        </div>

        {hasSplit && (
          <div className="flex items-center gap-3.5 bg-white/15 px-3.5 py-2.5 rounded-[4px] border border-white/20 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="text-right">
              <span className="block text-[10px] text-white/80 uppercase font-mono font-bold">
                Paid so far
              </span>
              <span className="text-sm font-bold text-white tabular-nums font-mono">
                {formatPeso(paidAmount)}
              </span>
            </div>
            <div className="h-8 w-px bg-white/25" />
            <div className="text-right">
              <span className="block text-[10px] text-white/80 uppercase font-mono font-bold">
                Remaining Due
              </span>
              <span
                className={`text-base font-extrabold tabular-nums font-mono ${
                  currentRemaining <= 0
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {formatPeso(currentRemaining)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
