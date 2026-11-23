"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: number;
  name: string;
}

interface CategorySelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  categories: CategoryOption[];
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

export function CategorySelect({
  value,
  onChange,
  categories,
  allLabel = "All Categories",
  placeholder = "Filter by category...",
  disabled = false,
  triggerClassName,
}: CategorySelectProps) {
  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("w-full !h-9 text-sm rounded-[2px]", triggerClassName)}
      >
        <SelectValue placeholder={placeholder}>
          {(val: string | null) => {
            if (!val || val === "all") return allLabel;
            return (
              categories.find((item) => String(item.id) === val)?.name ??
              placeholder
            );
          }}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">{allLabel}</SelectItem>
          {categories.map((item) => (
            <SelectItem key={item.id} value={item.id.toString()}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}