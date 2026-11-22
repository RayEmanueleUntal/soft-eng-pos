// Searchable active-supplier picker for the Create Purchase Order form in the POS inventory module.
// Wraps the Base UI Combobox so staff can type to filter suppliers by company name before picking one.
// Used only by CreatePurchaseOrderForm, which keeps the picked supplier id as a string.
"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { Supplier } from "@/lib/suppliers/suppliers";

interface SupplierSearchSelectProps {
  suppliers: Supplier[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

// Returns the company name shown in the input and matched while typing.
function getSupplierLabel(supplier: Supplier): string {
  return supplier.companyName || supplier.name || "";
}

// Renders a type-to-filter supplier combobox with a lead-time hint per option.
export function SupplierSearchSelect({
  suppliers,
  value,
  disabled,
  onChange,
}: SupplierSearchSelectProps) {
  const selected = suppliers.find((supplier) => String(supplier.id) === value) ?? null;

  return (
    <Combobox.Root
      items={suppliers}
      value={selected}
      disabled={disabled}
      autoHighlight
      itemToStringLabel={getSupplierLabel}
      isItemEqualToValue={(item, current) => item.id === current.id}
      onValueChange={(next) => onChange(next ? String(next.id) : "")}
    >
      <div className="relative">
        <Combobox.Input
          aria-label="Search active suppliers"
          placeholder="Search active suppliers..."
          autoComplete="off"
          className="h-9 w-full min-w-0 rounded-[4px] border border-input bg-transparent pr-8 pl-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Combobox.Trigger
          aria-label="Show suppliers"
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground disabled:opacity-50"
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-[60]">
          <Combobox.Popup className="w-(--anchor-width) overflow-hidden rounded-[4px] border border-border bg-popover text-popover-foreground">
            <Combobox.Empty className="px-3 py-2 text-xs text-muted-foreground">
              No suppliers match
            </Combobox.Empty>
            <Combobox.List className="max-h-60 overflow-y-auto p-1">
              {(supplier: Supplier) => (
                <Combobox.Item
                  key={supplier.id}
                  value={supplier}
                  className="flex cursor-default items-center gap-2 rounded-[4px] py-1.5 pr-2 pl-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <span className="flex-1 truncate">{getSupplierLabel(supplier)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {supplier.leadTimeDays}d lead
                  </span>
                  <Combobox.ItemIndicator className="flex size-4 items-center justify-center">
                    <Check className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
