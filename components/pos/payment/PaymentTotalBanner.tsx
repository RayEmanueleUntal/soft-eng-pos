import { formatPeso } from "@/lib/pos";
import type { PaymentModalCustomer } from "@/lib/pos";

interface PaymentTotalBannerProps {
  cartTotal: number;
  customer?: PaymentModalCustomer | null;
}

export function PaymentTotalBanner({ cartTotal, customer }: PaymentTotalBannerProps) {
  return (
    <div className="bg-foreground text-white p-5 rounded-[4px] text-center my-2 shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
      <p className="text-xs text-muted-foreground/80 uppercase tracking-wider font-medium">
        Total Amount Due
      </p>
      <p className="text-3xl font-extrabold mt-1 text-white font-mono tabular-nums">
        {formatPeso(cartTotal)}
      </p>
      {customer && (
        <p className="text-xs text-muted-foreground/60 mt-1 font-sans">
          Customer: <span className="font-semibold text-white">{customer.name}</span> ({customer.type || "Retail"})
        </p>
      )}
    </div>
  );
}
