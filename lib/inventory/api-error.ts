// Shared API error helper for the Inventory Management module of the POS system.
// Turns axios/backend errors into short messages that inventory modals can show.
// Used by the stock movement API functions and the bin assignment modal.
import axios from "axios";

// Returns a readable message from an API error, or the fallback if none applies.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (!error.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to perform this action.";
  }

  // The backend nests the text under `details`; plain NestJS errors use the top level.
  const data = error.response.data;
  const message = data?.details?.message ?? data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return typeof message === "string" && message ? message : fallback;
}
