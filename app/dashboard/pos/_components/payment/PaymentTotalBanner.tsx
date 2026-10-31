import { formatPeso } from "@/lib/pos";
import type { PaymentModalCustomer } from "@/lib/pos";

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
    <div className="bg-foreground text-white p-4 rounded-[4px] my-2 shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="text-[11px] text-muted-foreground/80 uppercase tracking-wider font-semibold font-mono">
            {hasSplit ? "Grand Total" : "Total Amount Due"}
          </p>
          <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {formatPeso(cartTotal)}
          </p>
          {customer ? (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 font-sans">
              Customer: <span className="font-semibold text-white">{customer.name}</span> (
              {customer.type || "Retail"})
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 font-sans">
              Customer: <span className="font-semibold text-white">None / Retail</span> (Walk-in)
            </p>
          )}
        </div>

        {hasSplit && (
          <div className="flex items-center gap-4 bg-white/10 px-3.5 py-2 rounded-[4px] border border-white/15">
            <div className="text-right">
              <span className="block text-[10px] text-muted-foreground/90 uppercase font-mono">
                Paid so far
              </span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {formatPeso(paidAmount)}
              </span>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div className="text-right">
              <span className="block text-[10px] text-muted-foreground/90 uppercase font-mono">
                Remaining Due
              </span>
              <span
                className={`font-mono text-base font-extrabold tabular-nums ${
                  currentRemaining <= 0 ? "text-emerald-400" : "text-amber-400"
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
