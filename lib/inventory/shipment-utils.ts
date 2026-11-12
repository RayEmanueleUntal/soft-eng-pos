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
  status: TrackingStatus;
  note: string;
}

// The backend appends "[<ISO time> Status -> <STATUS>]: <note>" lines to `notes` on each status update.
const LOG_LINE = /^\[(\S+) Status -> (PENDING|DISPATCHED|DELIVERED)\]: ?(.*)$/;

// Splits notes into the user's own text, the raw log lines, and the parsed log entries.
export function splitShipmentNotes(notes: string | null | undefined): {
  base: string;
  rawLogLines: string[];
  entries: StatusLogEntry[];
} {
  const lines = (notes ?? "").split("\n");
  const firstLog = lines.findIndex((line) => LOG_LINE.test(line));

  if (firstLog === -1) {
    return { base: (notes ?? "").trim(), rawLogLines: [], entries: [] };
  }

  const rawLogLines = lines.slice(firstLog);
  const entries: StatusLogEntry[] = [];
  for (const line of rawLogLines) {
    const match = LOG_LINE.exec(line);
    if (match) {
      entries.push({
        timestamp: match[1],
        status: match[2] as TrackingStatus,
        note: match[3],
      });
    }
  }

  return {
    base: lines.slice(0, firstLog).join("\n").trim(),
    rawLogLines,
    entries,
  };
}