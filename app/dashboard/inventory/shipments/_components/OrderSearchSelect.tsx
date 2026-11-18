// Searchable completed-order picker for the Log New Shipment dialog.
// Wraps the Base UI Combobox the same way the purchase-order supplier field does.
// The parent loads matching orders from the API; this control only displays and selects them.
"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { EligibleTransaction } from "@/lib/inventory/shipment-types";
import { formatPeso } from "@/lib/utils";

interface OrderSearchSelectProps {
  transactions: EligibleTransaction[];
  value: EligibleTransaction | null;
  disabled: boolean;
  loading: boolean;
  onQueryChange: (query: string) => void;
  onChange: (transaction: EligibleTransaction | null) => void;
}

// Invoice number shown in the closed field after an order is chosen.
function getOrderLabel(transaction: EligibleTransaction): string {
  return transaction.invoice_number ?? `Order #${transaction.id}`;
}

// True when the order already has a PENDING or DISPATCHED shipment.
function hasActiveShipment(transaction: EligibleTransaction): boolean {
  return (transaction.shipments ?? []).some(
    (shipment) => shipment.tracking_status !== "DELIVERED",
  );
}

// Renders a type-to-search order combobox; the chosen invoice stays in the input.
export function OrderSearchSelect({
  transactions,
  value,
  disabled,
  loading,
  onQueryChange,
  onChange,
}: OrderSearchSelectProps) {
  const items = React.useMemo(() => {
    if (value && !transactions.some((transaction) => transaction.id === value.id)) {
      return [value, ...transactions];
    }
    return transactions;
  }, [transactions, value]);

  return (
    <Combobox.Root
      items={items}
      value={value}
      disabled={disabled}
      autoHighlight
      filter={null}
      itemToStringLabel={getOrderLabel}
      isItemEqualToValue={(item, current) => item.id === current.id}
      onValueChange={(next) => onChange(next)}
      onInputValueChange={(inputValue, details) => {
        if (details.reason === "input-change" || details.reason === "input-clear") {
          onQueryChange(inputValue);
        }
      }}
    >
      <div className="relative">
        <Combobox.Input
          aria-label="Search completed orders"
          placeholder="Search invoice number or customer"
          autoComplete="off"
          className="h-8 w-full min-w-0 rounded-[4px] border border-input bg-transparent pr-8 pl-2.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Combobox.Trigger
          aria-label="Show completed orders"
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground disabled:opacity-50"
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-[60]">
          <Combobox.Popup className="w-(--anchor-width) overflow-hidden rounded-[4px] border border-border bg-popover text-popover-foreground">
            <Combobox.Empty className="px-3 py-2 text-xs text-muted-foreground">
              {loading ? "Loading orders..." : "No completed orders found."}
            </Combobox.Empty>
            <Combobox.List className="max-h-60 overflow-y-auto p-1">
              {(transaction: EligibleTransaction) => {
                const blocked = hasActiveShipment(transaction);
                return (
                  <Combobox.Item
                    key={transaction.id}
                    value={transaction}
                    disabled={blocked}
                    className="flex cursor-default items-center gap-2 rounded-[4px] py-1.5 pr-2 pl-2 text-xs outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono font-semibold tabular-nums">
                        {getOrderLabel(transaction)}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {transaction.customer?.name ?? "Walk-in Customer"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-[11px] tabular-nums">
                        {formatPeso(Number(transaction.grand_total))}
                      </span>
                      {blocked && (
                        <span className="block text-[10px] font-semibold text-amber-700">
                          Active shipment exists
                        </span>
                      )}
                    </span>
                    <Combobox.ItemIndicator className="flex size-4 items-center justify-center">
                      <Check className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
