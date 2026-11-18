// components/ui/sort-select.tsx
"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SortKey } from "@/lib/utils/sort";
export type { SortKey };

export interface SortOptionConfig {
  /** Compact label shown inside the trigger button */
  shortLabel: string;
  /** Descriptive label shown inside the dropdown menu */
  menuLabel: string;
}

export const SORT_OPTION_CATALOG: Record<SortKey, SortOptionConfig> = {
  DEFAULT: { shortLabel: "Default Sort", menuLabel: "Default Sort" },
  NAME_ASC: { shortLabel: "A-Z", menuLabel: "Alphabetical A-Z" },
  NAME_DESC: { shortLabel: "Z-A", menuLabel: "Alphabetical Z-A" },
  CREDIT_LIMIT_ASC: {
    shortLabel: "Limit Low-High",
    menuLabel: "Credit Limit Low to High",
  },
  CREDIT_LIMIT_DESC: {
    shortLabel: "Limit High-Low",
    menuLabel: "Credit Limit High to Low",
  },
  OUTSTANDING_ASC: {
    shortLabel: "Balance Low-High",
    menuLabel: "Outstanding Low to High",
  },
  OUTSTANDING_DESC: {
    shortLabel: "Balance High-Low",
    menuLabel: "Outstanding High to Low",
  },
  STOCK_ASC: { shortLabel: "Stock Low-High", menuLabel: "Stock Low to High" },
  STOCK_DESC: { shortLabel: "Stock High-Low", menuLabel: "Stock High to Low" },
  RETAIL_DESC: {
    shortLabel: "Retail High-Low",
    menuLabel: "Retail High to Low",
  },
  RETAIL_ASC: {
    shortLabel: "Retail Low-High",
    menuLabel: "Retail Low to High",
  },
  COST_DESC: { shortLabel: "Cost High-Low", menuLabel: "Cost High to Low" },
  COST_ASC: { shortLabel: "Cost Low-High", menuLabel: "Cost Low to High" },
  WHOLESALE_DESC: {
    shortLabel: "Wholesale High-Low",
    menuLabel: "Wholesale High to Low",
  },
  WHOLESALE_ASC: {
    shortLabel: "Wholesale Low-High",
    menuLabel: "Wholesale Low to High",
  },
  TOTAL_COST_DESC: {
    shortLabel: "Total High-Low",
    menuLabel: "Total Cost High to Low",
  },
  TOTAL_COST_ASC: {
    shortLabel: "Total Low-High",
    menuLabel: "Total Cost Low to High",
  },
  DATE_DESC: { shortLabel: "Newest", menuLabel: "Date Newest to Oldest" },
  DATE_ASC: { shortLabel: "Oldest", menuLabel: "Date Oldest to Newest" },
  ID_ASC: { shortLabel: "#ID Low-High", menuLabel: "#ID Low to High" },
  ID_DESC: { shortLabel: "#ID High-Low", menuLabel: "#ID High to Low" },
};

export interface SortSelectProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  /** List of sort keys active on this specific page */
  options: Exclude<SortKey, "DEFAULT">[];
  /** Override per-option labels on a page (e.g. "Qty Adj High to Low") */
  labelOverrides?: Partial<Record<SortKey, Partial<SortOptionConfig>>>;
  /** Include a "Default Sort" option inside the dropdown list */
  showDefaultOption?: boolean;
  /** Optional label above the select (defaults to "Sort", pass null to hide) */
  label?: string | null;
  /** Adjust trigger height/width to match sibling filters (e.g. "!h-9 w-[150px]") */
  triggerClassName?: string;
  className?: string;
}

export function SortSelect({
  value,
  onChange,
  options,
  labelOverrides,
  showDefaultOption = false,
  label = "Sort",
  triggerClassName,
  className,
}: SortSelectProps) {
  const getConfig = (key: SortKey): SortOptionConfig => ({
    ...SORT_OPTION_CATALOG[key],
    ...labelOverrides?.[key],
  });

  const activeConfig = getConfig(value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label !== null && <Label>{label}</Label>}
      <Select
        value={value}
        onValueChange={(val) => onChange((val ?? "DEFAULT") as SortKey)}
      >
        <SelectTrigger
          className={cn(
            "!h-8 w-[140px] text-xs rounded-[2px] justify-start gap-2 [&>svg:last-child]:hidden",
            triggerClassName,
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Default Sort">
            {activeConfig.shortLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {showDefaultOption && (
            <SelectItem value="DEFAULT" className="text-xs">
              {getConfig("DEFAULT").menuLabel}
            </SelectItem>
          )}
          {options.map((key) => (
            <SelectItem key={key} value={key} className="text-xs">
              {getConfig(key).menuLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
