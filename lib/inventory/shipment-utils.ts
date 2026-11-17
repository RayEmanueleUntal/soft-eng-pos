// Display and workflow helpers for the Shipments subpage (labels, allowed next status, notes log parsing).
import { TrackingStatus } from "./shipment-types";

export const STATUS_LABELS: Record<TrackingStatus, string> = {
  PENDING: "Pending",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

// Strict one-step workflow: PENDING -> DISPATCHED -> DELIVERED. DELIVERED is final.
const NEXT_STATUS: Record<TrackingStatus, TrackingStatus | null> = {
  PENDING: "DISPATCHED",
  DISPATCHED: "DELIVERED",
  DELIVERED: null,
};

// Returns the only status a shipment may move to next, or null when it is final.
export function getNextStatus(current: TrackingStatus): TrackingStatus | null {
  return NEXT_STATUS[current];
}

// Formats an ISO timestamp for tables and the drawer.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface StatusLogEntry {
  timestamp: string;
  action: string; // e.g. "Dispatched", "Delivered", "Details edited"
  note: string;
}

// Matches backend status lines "[<ISO> Status -> <STATUS>]: <note>" AND frontend edit lines "[<ISO> Edited]: <note>"
const STATUS_LOG_LINE =
  /^\[(\S+) Status -> (PENDING|DISPATCHED|DELIVERED)\]: ?(.*)$/;
const EDIT_LOG_LINE = /^\[(\S+) Edited\]: ?(.*)$/;

export function formatEditLogLine(summary: string): string {
  return `[${new Date().toISOString()} Edited]: ${summary}`;
}

export function formatStatusLogLine(
  status: TrackingStatus,
  note?: string,
): string {
  return `[${new Date().toISOString()} Status -> ${status}]: ${(note ?? "").trim()}`;
}

// Splits notes into the user's own text, the raw log lines, and the parsed log entries.
export function splitShipmentNotes(notes: string | null | undefined): {
  base: string;
  rawLogLines: string[];
  entries: StatusLogEntry[];
} {
  const lines = (notes ?? "").split("\n");
  const firstLog = lines.findIndex(
    (line) => STATUS_LOG_LINE.test(line) || EDIT_LOG_LINE.test(line),
  );

  if (firstLog === -1) {
    return { base: (notes ?? "").trim(), rawLogLines: [], entries: [] };
  }

  const rawLogLines = lines.slice(firstLog);
  const entries: StatusLogEntry[] = [];

  for (const line of rawLogLines) {
    const statusMatch = STATUS_LOG_LINE.exec(line);
    if (statusMatch) {
      const rawStatus = statusMatch[2] as TrackingStatus;
      entries.push({
        timestamp: statusMatch[1],
        action: STATUS_LABELS[rawStatus] ?? rawStatus,
        note: statusMatch[3],
      });
      continue;
    }

    const editMatch = EDIT_LOG_LINE.exec(line);
    if (editMatch) {
      entries.push({
        timestamp: editMatch[1],
        action: "Details edited",
        note: editMatch[2],
      });
    }
  }

  return {
    base: lines.slice(0, firstLog).join("\n").trim(),
    rawLogLines,
    entries,
  };
}