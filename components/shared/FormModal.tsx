"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  md: "sm:max-w-xl",  // 576px (new default, wider than shadcn's 512px)
  lg: "sm:max-w-2xl", // 672px (great for multi-field forms)
  xl: "sm:max-w-3xl", // 768px (great for detailed previews)
};

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  className,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] sm:w-full rounded-[4px] border border-[#0F172A] shadow-[0px_4px_0px_rgba(15,23,42,0.08)] ring-0",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="break-words">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}