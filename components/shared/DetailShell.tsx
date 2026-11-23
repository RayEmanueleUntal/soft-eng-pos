"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailShellProps {
  title: React.ReactNode;
  backLabel?: string;
  backHref?: string;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  error?: {
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null;
  children?: React.ReactNode;
  maxWidth?: "2xl" | "4xl" | "6xl";
  className?: string;
}

const MAX_WIDTH_CLASSES = {
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
};

export function DetailShell({
  title,
  backLabel = "Back to previous page",
  backHref,
  onBack,
  headerAction,
  loading = false,
  loadingMessage = "Loading...",
  error = null,
  children,
  maxWidth = "4xl",
  className,
}: DetailShellProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div
        className={cn(
          "flex-1 space-y-6 p-6 pb-16 bg-background mx-auto font-sans",
          MAX_WIDTH_CLASSES[maxWidth],
          className,
        )}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-[4px] text-xs"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-[24px] font-bold font-heading tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-xs font-sans">
              {loadingMessage}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-card rounded-[4px] border border-input p-6 max-w-md text-center shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-heading font-bold text-foreground mb-2">
                {error.title ?? "Something went wrong"}
              </h2>
              <p className="text-muted-foreground text-xs mb-6 font-sans">
                {error.message}
              </p>
              <Button
                type="button"
                onClick={error.onAction ?? handleBack}
                className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {error.actionLabel ?? backLabel}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && children}
      </div>
    </div>
  );
}