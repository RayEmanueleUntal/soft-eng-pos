"use client";

import { useEffect } from "react";

interface UsePosShortcutsOptions {
  onFocusSearch?: () => void;
  onHold?: () => void;
  onCheckout?: () => void;
  isEnabled?: boolean;
}

export function usePosShortcuts({
  onFocusSearch,
  onHold,
  onCheckout,
  isEnabled = true,
}: UsePosShortcutsOptions) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        onFocusSearch?.();
      }
      if (e.key === "F8") {
        e.preventDefault();
        onHold?.();
      }
      if (e.key === "F12") {
        e.preventDefault();
        onCheckout?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onFocusSearch, onHold, onCheckout, isEnabled]);
}
