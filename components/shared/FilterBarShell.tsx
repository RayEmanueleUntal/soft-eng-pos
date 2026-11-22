"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

interface FilterBarShellProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
  };
  children?: React.ReactNode;
  action?: React.ReactNode;
  columns?: 4 | 5 | 6;
  className?: string;
}

const GRID_COLS = {
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export function FilterBarShell({
  search,
  children,
  action,
  columns = 5,
  className,
}: FilterBarShellProps) {
  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-end gap-3", className)}>
      <div
        className={cn(
          "flex-1 grid items-end gap-3 md:grid-cols-2",
          GRID_COLS[columns],
        )}
      >
        {search && (
          <div className="space-y-2 lg:col-span-2">
            <Label>{search.label ?? "Search"}</Label>
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          </div>
        )}

        {children}
      </div>

      {action && (
        <div className="shrink-0 flex items-center justify-end">
          {action}
        </div>
      )}
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}