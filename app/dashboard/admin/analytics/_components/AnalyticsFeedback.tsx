"use client";

import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shared loading / error / empty panels for analytics sections.
// Keeps the dense industrial styling consistent across all four tabs.

export function AnalyticsLoading({ label = "Loading analytics..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function AnalyticsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Failed to load analytics
      </div>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

export function AnalyticsEmpty({
  message = "No data available for the selected range.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 text-center",
        className,
      )}
    >
      <Inbox className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function InvalidRangeNotice() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
      Start date must be on or before end date. Adjust the date range to load
      analytics.
    </div>
  );
}
