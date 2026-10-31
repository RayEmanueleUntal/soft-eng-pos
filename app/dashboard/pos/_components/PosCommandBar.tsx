"use client";

import { Button } from "@/components/ui/button";

interface PosCommandBarProps {
  cartCount: number;
  cartTotal: number;
  onFocusSearch: () => void;
  onHoldTransaction: () => void;
  onOpenCheckout: () => void;
}

export function PosCommandBar({
  cartCount,
  cartTotal,
  onFocusSearch,
  onHoldTransaction,
  onOpenCheckout,
}: PosCommandBarProps) {
  return (
    <div className="h-[48px] bg-secondary-foreground shrink-0 flex items-center px-4 gap-3">
      <button
        onClick={onFocusSearch}
        className="flex items-center gap-2 text-white/80 hover:text-white text-sm cursor-pointer"
      >
        <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-white/20 bg-card/10 text-white">
          [F2]
        </span>
        Search
      </button>
      <button
        onClick={onHoldTransaction}
        className="flex items-center gap-2 text-white/80 hover:text-white text-sm cursor-pointer"
      >
        <span className="inline-flex items-center justify-center px-1.5 h-5 text-[10px] font-mono font-bold rounded-[2px] border border-white/20 bg-card/10 text-white">
          [F8]
        </span>
        Hold
      </button>
      <div className="ml-auto">
        <Button
          onClick={onOpenCheckout}
          disabled={cartCount === 0 || cartTotal <= 0}
          className="h-8 bg-primary hover:bg-primary/80 text-white px-4 text-[13px] font-bold shadow-none rounded-[4px] uppercase"
        >
          Checkout
          <span className="ml-2 inline-flex items-center justify-center px-1.5 h-4 text-[10px] font-mono font-bold rounded-[2px] bg-card/20 text-white border border-white/20">
            [F12]
          </span>
        </Button>
      </div>
    </div>
  );
}
