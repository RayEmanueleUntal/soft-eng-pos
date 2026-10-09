// Key-value table for the admin System Settings screen of the POS system.
// Loads every store-wide setting from GET /system-settings and lists key, value, description and last update.
// Shows loading, empty and error states; rows are sorted by key. Add and Edit open SettingFormDialog.
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchSystemSetting,
  fetchSystemSettings,
  SettingApiError,
  SystemSetting,
} from "@/lib/admin/system-settings";

import { SettingFormDialog } from "./SettingFormDialog";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [fetchingKey, setFetchingKey] = useState<string | null>(null);
  const [formSession, setFormSession] = useState(0);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

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

  // Opens the form in create mode.
  function handleAdd() {
    setEditingSetting(null);
    setFormSession((n) => n + 1);
    setIsFormOpen(true);
  }

  // Loads the latest copy of a setting, then opens the form in edit mode.
  async function handleEdit(setting: SystemSetting) {
    try {
      setFetchingKey(setting.key);
      setError("");
      const latest = await fetchSystemSetting(setting.key);
      setEditingSetting(latest);
      setFormSession((n) => n + 1);
      setIsFormOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load this setting.");
      if (err instanceof SettingApiError && err.status === 404) {
        await loadSettings();
      }
    } finally {
      setFetchingKey(null);
    }
  }

  // Shows a success message and reloads the list after a create or update.
  async function handleSaved(saved: SystemSetting, mode: "create" | "edit") {
    setSuccessMessage(
      mode === "create" ? `Setting "${saved.key}" created.` : `Setting "${saved.key}" updated.`,
    );
    await loadSettings();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleAdd}
          size="sm"
          className="gap-1.5 h-8 text-xs rounded-[2px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs font-sans"
        >
          <PlusIcon className="size-3.5" />
          Add Setting
        </Button>
      </div>

      {successMessage && (
        <div className="flex items-center justify-between gap-2 text-xs font-sans p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-950 font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

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
              <TableHead className={`${HEAD_CLASS} w-[100px] text-right pr-4`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && settings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                  colSpan={5}
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
                  <TableCell className="py-2.5 text-right pr-4">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={fetchingKey === setting.key}
                      onClick={() => handleEdit(setting)}
                      title={`Edit ${setting.key}`}
                      className="h-7 w-7 rounded-[2px] hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                    >
                      {fetchingKey === setting.key ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <PencilIcon className="size-3.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SettingFormDialog
        key={formSession}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        setting={editingSetting}
        onSaved={handleSaved}
      />
    </div>
  );
}
