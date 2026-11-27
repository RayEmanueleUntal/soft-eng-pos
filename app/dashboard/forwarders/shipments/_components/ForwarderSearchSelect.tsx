// Searchable forwarder picker for the Log New Shipment dialog.
// Mirrors OrderSearchSelect, but filters client-side since all active
// forwarders are already loaded into memory.
"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { Forwarder } from "@/lib/inventory/shipment-types";

interface ForwarderSearchSelectProps {
  forwarders: Forwarder[];
  value: Forwarder | null;
  disabled: boolean;
  loading: boolean;
  onChange: (forwarder: Forwarder | null) => void;
}

// Renders a type-to-search forwarder combobox filtered by company name.
export function ForwarderSearchSelect({
  forwarders,
  value,
  disabled,
  loading,
  onChange,
}: ForwarderSearchSelectProps) {
  return (
    <Combobox.Root
      items={forwarders}
      value={value}
      disabled={disabled}
      autoHighlight
      itemToStringLabel={(forwarder: Forwarder) => forwarder.company_name}
      isItemEqualToValue={(item, current) => item.id === current.id}
      onValueChange={(next) => onChange(next)}
    >
      <div className="relative">
        <Combobox.Input
          aria-label="Search forwarders"
          placeholder="Search forwarder by name"
          autoComplete="off"
          className="h-8 w-full min-w-0 rounded-[4px] border border-input bg-transparent pr-8 pl-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Combobox.Trigger
          aria-label="Show forwarders"
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground disabled:opacity-50"
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-[60]">
          <Combobox.Popup className="w-(--anchor-width) overflow-hidden rounded-[4px] border border-border bg-popover text-popover-foreground">
            <Combobox.Empty className="text-sm text-muted-foreground">
              <span className="block px-3 py-2">
                {loading ? "Loading forwarders..." : "No forwarders found."}
              </span>
            </Combobox.Empty>
            <Combobox.List className="max-h-60 overflow-y-auto p-1">
              {(forwarder: Forwarder) => (
                <Combobox.Item
                  key={forwarder.id}
                  value={forwarder}
                  className="flex cursor-default items-center gap-2 rounded-[4px] py-1.5 pr-2 pl-2 text-sm outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {forwarder.company_name}
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
