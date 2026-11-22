import * as React from "react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}