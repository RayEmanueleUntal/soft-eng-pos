import { useState, useEffect } from "react";

const USER_NAME = "user_name";
const USER_ROLE = "user_role";
const REFRESH_TOKEN = "refresh_token";
const ACCESS_TOKEN = "access_token";

/**
 * Parses JWT token payload without external libraries.
 */
export function decodeJwtPayload<T = Record<string, any>>(
  token: string,
): T | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Stores session tokens and extracts/persists user information.
 */
export function setAuthSession(
  accessToken: string,
  refreshToken: string,
  fallbackUsername?: string,
  fallbackRole?: string,
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(REFRESH_TOKEN, refreshToken);

  const payload = decodeJwtPayload<{ username?: string; role?: string }>(
    refreshToken,
  );

  const username = payload?.username || fallbackUsername;
  const role = payload?.role?.replaceAll("_", " ") || fallbackRole;

  if (username) {
    localStorage.setItem(USER_NAME, username);
  }

  if (role) {
    localStorage.setItem(USER_ROLE, role);
  }
}

/**
 * Clears all client-side auth data on logout.
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(USER_NAME);
  localStorage.removeItem(USER_ROLE);
}

/**
 * Custom Hook to read the stored user name without hydration mismatch.
 */
export function useCurrentUserName(fallback = "Staff User"): string {
  const [userName, setUserName] = useState<string>(fallback);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem(USER_NAME);
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, []);

  return userName;
}

export function getStoredUserName(fallback = "Staff User"): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(USER_NAME) || fallback;
}
