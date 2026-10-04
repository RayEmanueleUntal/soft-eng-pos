// Client hook that returns the logged-in user's role for the POS system's UI.
// Reads it from /api/auth/me; in development it falls back to the mock role used by lib/api.ts.
// Used to hide inventory actions from roles that may only view stock.
"use client";

import { useEffect, useState } from "react";

// Returns the current role, or null while loading or when not logged in.
export function useCurrentRole(): string | null {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRole = async () => {
      let resolved: string | null = null;

      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        resolved = data.role ?? null;
      } catch {
        resolved = null;
      }

      if (!resolved && process.env.NODE_ENV !== "production") {
        resolved = process.env.NEXT_PUBLIC_MOCK_ROLE || "ADMIN";
      }

      if (mounted) {
        setRole(resolved);
      }
    };

    loadRole();

    return () => {
      mounted = false;
    };
  }, []);

  return role;
}
