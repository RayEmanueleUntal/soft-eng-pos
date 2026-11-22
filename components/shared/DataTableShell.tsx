"use client";

import * as React from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

interface DataTableShellProps {
  title?: string;
  totalRecords?: number;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    itemLabel?: string;
    loading?: boolean;
    onPageChange: (page: number) => void;
  };
}

export function DataTableShell({
  title,
  totalRecords,
  headerRight,
  children,
  className,
  pagination,
}: DataTableShellProps) {
  const showHeader = title || totalRecords !== undefined || headerRight;

  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? (
            <h2 className="text-[15px] font-heading font-semibold text-foreground">
              {title}
            </h2>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {totalRecords !== undefined && (
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                Total records: {totalRecords}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}

      <div className="rounded-[4px] border border-input bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)] overflow-hidden">
        {children}

        {pagination && (
          <div className="border-t border-border px-4 py-2.5 bg-card">
            <TablePagination
              className="w-full px-0"
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              itemLabel={pagination.itemLabel}
              loading={pagination.loading}
              onPageChange={pagination.onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}