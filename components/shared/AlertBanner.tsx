"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  variant?: "error" | "success" | "warning";
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({
  variant = "error",
  message,
  onRetry,
  onDismiss,
  className,
}: AlertBannerProps) {
  const isError = variant === "error";
  const isWarning = variant === "warning";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border p-3 text-sm",
        isError
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : isWarning
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        className,
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        {isError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : isWarning ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-7 text-xs"
          >
            Retry
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}