// Types and API helpers for the admin System Settings screen of the POS system.
// Wraps the /system-settings endpoints (store-wide key-value business rules).
// Failed calls throw a SettingApiError with a short message and the HTTP status.
import axios from "axios";

import { apiClient } from "@/lib/api";

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export interface CreateSettingInput {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateSettingInput {
  value: string;
  description?: string;
}

// Seeded keys that drive live business rules; deleting them needs a stronger warning.
export const CORE_SETTING_KEYS = [
  "ALLOW_NEGATIVE_INVENTORY",
  "CURRENCY_SYMBOL",
  "ENABLE_WHOLESALE_PRICING",
  "RECEIPT_FOOTER_MESSAGE",
  "REQUIRE_RECEIPT_FOR_RETURN",
  "RESTOCKING_FEE_PERCENT",
  "RETURN_WINDOW_DAYS",
  "STORE_NAME",
  "TAX_RATE_PERCENT",
] as const;

export class SettingApiError extends Error {
  status?: number;

  // Builds an error carrying a readable message and the HTTP status, if any.
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SettingApiError";
    this.status = status;
  }
}

// Returns true if the key is one of the seeded core business-rule settings.
export function isCoreSettingKey(key: string): boolean {
  return (CORE_SETTING_KEYS as readonly string[]).includes(key);
}

// Reads the backend message, which may be nested under `details` or be an array.
function readServerMessage(data: unknown): string | null {
  const body = data as { message?: unknown; details?: { message?: unknown } } | undefined;
  const message = body?.details?.message ?? body?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return typeof message === "string" && message ? message : null;
}

// Converts any API failure into a SettingApiError with a user-facing message.
function toSettingError(error: unknown, fallback: string): SettingApiError {
  if (!axios.isAxiosError(error)) {
    return new SettingApiError(error instanceof Error && error.message ? error.message : fallback);
  }

  if (!error.response) {
    return new SettingApiError("Cannot reach the server. Check your connection and try again.");
  }

  const { status, data } = error.response;
  const serverMessage = readServerMessage(data);

  switch (status) {
    case 400:
      return new SettingApiError(
        serverMessage ?? "The request could not be saved. Please try again.",
        status,
      );
    case 403:
      return new SettingApiError("You do not have permission to change system settings.", status);
    case 404:
      return new SettingApiError("This setting no longer exists. Refresh and try again.", status);
    case 409:
      return new SettingApiError("A setting with this key already exists.", status);
    default:
      return new SettingApiError(serverMessage ?? fallback, status);
  }
}

// Builds the URL for one setting, escaping the key for the path.
function settingPath(key: string): string {
  return `/system-settings/${encodeURIComponent(key)}`;
}

// Fetches all system settings: GET /system-settings.
export async function fetchSystemSettings(): Promise<SystemSetting[]> {
  try {
    const response = await apiClient.get<SystemSetting[]>("/system-settings");

    if (!Array.isArray(response.data)) {
      throw new SettingApiError("Unexpected response while loading system settings.");
    }

    return response.data;
  } catch (error) {
    if (error instanceof SettingApiError) throw error;
    throw toSettingError(error, "Failed to load system settings.");
  }
}

// Fetches one setting by key: GET /system-settings/{key}.
export async function fetchSystemSetting(key: string): Promise<SystemSetting> {
  try {
    const response = await apiClient.get<SystemSetting>(settingPath(key));
    return response.data;
  } catch (error) {
    throw toSettingError(error, "Failed to load this setting.");
  }
}

// Creates a new setting key: POST /system-settings. Blank descriptions are omitted.
export async function createSystemSetting(input: CreateSettingInput): Promise<SystemSetting> {
  const body: CreateSettingInput = { key: input.key, value: input.value };
  if (input.description?.trim()) {
    body.description = input.description;
  }

  try {
    const response = await apiClient.post<SystemSetting>("/system-settings", body);
    return response.data;
  } catch (error) {
    throw toSettingError(error, "Failed to create the setting.");
  }
}

// Updates a setting's value and description: PATCH /system-settings/{key}.
export async function updateSystemSetting(
  key: string,
  input: UpdateSettingInput,
): Promise<SystemSetting> {
  try {
    const response = await apiClient.patch<SystemSetting>(settingPath(key), {
      value: input.value,
      description: input.description ?? "",
    });
    return response.data;
  } catch (error) {
    throw toSettingError(error, "Failed to update the setting.");
  }
}

// Deletes a setting key: DELETE /system-settings/{key}.
// apiClient only adds Idempotency-Key for POST/PUT/PATCH, so it is set here.
export async function deleteSystemSetting(key: string): Promise<SystemSetting> {
  try {
    const response = await apiClient.delete<SystemSetting>(settingPath(key), {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    return response.data;
  } catch (error) {
    throw toSettingError(error, "Failed to delete the setting.");
  }
}
