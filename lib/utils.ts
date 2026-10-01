import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts a user-readable error message from an unknown error.
 * Handles Axios network errors, HTTP status codes (401, 403, 404),
 * backend response messages, standard Errors, and raw strings.
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;

  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") {
      return "Unable to connect to server. Please check if the backend is running.";
    }

    const status = error.response?.status;
    if (status === 401) {
      return "Authentication required. Please log in to continue.";
    }
    if (status === 403) {
      return "Access denied. You do not have permission to view or perform this action.";
    }
    if (status === 404) {
      return error.response?.data?.message || fallback;
    }

    // Backend validation error (e.g., NestJS 400 Bad Request)
    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      return Array.isArray(backendMessage) ? backendMessage.join(", ") : String(backendMessage);
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
