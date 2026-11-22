"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/pageheader";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
}

export function PageShell({
  title,
  subtitle = "",
  headerAction,
  children,
  className,
  cardClassName,
}: PageShellProps) {
  return (
    <div className={cn("flex-1 space-y-6", className)}>
      <div className="shrink-0 mt-4 mb-4 flex flex-wrap items-center justify-between gap-4">
        <PageHeader header={title} subheader={subtitle} />
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      <div
        className={cn(
          "bg-card p-6 rounded-lg shadow-sm border border-border flex flex-col gap-4",
          cardClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}