// Key-value table for the admin System Settings screen of the POS system.
// Loads every store-wide setting from GET /system-settings and lists key, value, description and last update.
// Shows loading, empty and error states; rows are sorted by key.
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchSystemSettings, SystemSetting } from "@/lib/admin/system-settings";

const HEAD_CLASS =
  "text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9";

// Formats an ISO timestamp as a readable local date and time.
function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

// Renders the list of system settings with loading, empty and error states.
export function SystemSettingsTable() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Loads all settings and sorts them by key.
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchSystemSettings();
      setSettings([...data].sort((a, b) => a.key.localeCompare(b.key)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettings();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadSettings]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-red-50 border border-red-200 text-red-700 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-700 hover:text-red-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-[4px] border border-border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70 hover:border-l-0 border-b border-border">
              <TableHead className={HEAD_CLASS}>Key</TableHead>
              <TableHead className={HEAD_CLASS}>Value</TableHead>
              <TableHead className={HEAD_CLASS}>Description</TableHead>
              <TableHead className={`${HEAD_CLASS} w-[180px]`}>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && settings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-muted-foreground font-sans text-xs"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading system settings...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : settings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-muted-foreground font-sans text-xs"
                >
                  No system settings yet.
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow
                  key={setting.key}
                  className="hover:bg-accent/40 border-b border-border transition-colors h-11"
                >
                  <TableCell className="font-mono text-xs font-medium text-foreground py-2.5">
                    {setting.key}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground py-2.5 max-w-[240px] whitespace-normal break-words">
                    {setting.value}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground py-2.5 max-w-[360px] whitespace-normal break-words">
                    {setting.description?.trim() ? setting.description : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5">
                    {formatUpdatedAt(setting.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
