// Delete confirmation dialog for the admin System Settings screen of the POS system.
// Calls DELETE /system-settings/{key}; seeded core keys get a stronger business-rule warning.
// A 404 closes the dialog and is reported to the table so it can refresh.
"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteSystemSetting,
  isCoreSettingKey,
  SettingApiError,
  SystemSetting,
} from "@/lib/admin/system-settings";

interface DeleteSettingDialogProps {
  setting: SystemSetting | null;
  onClose: () => void;
  onDeleted: (key: string) => void;
  onMissing: (message: string) => void;
}

// Renders the delete confirmation for one setting; `setting` null keeps it closed.
export function DeleteSettingDialog({
  setting,
  onClose,
  onDeleted,
  onMissing,
}: DeleteSettingDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!setting) return null;

  const isCore = isCoreSettingKey(setting.key);

  // Deletes the setting and reports the outcome to the table.
  async function handleDelete() {
    if (!setting) return;
    try {
      setDeleting(true);
      setError("");
      await deleteSystemSetting(setting.key);
      onDeleted(setting.key);
    } catch (err) {
      if (err instanceof SettingApiError && err.status === 404) {
        onMissing(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to delete the setting.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[460px] bg-card border-border rounded-[4px] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold text-foreground tracking-tight">
            Delete Setting
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-mono font-semibold text-foreground">{setting.key}</span>?
          </DialogDescription>
        </DialogHeader>

        {isCore ? (
          <div className="flex items-start gap-2 text-xs font-sans p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-[2px]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              This key is a live business rule. Deleting it can change how returns, tax,
              pricing, or receipts behave across the store. This cannot be undone.
            </span>
          </div>
        ) : (
          <div className="text-xs font-sans p-3 bg-muted border border-border text-foreground rounded-[2px]">
            This removes the setting permanently. This cannot be undone.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs font-sans p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[2px]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={onClose}
            className="rounded-[2px] h-8 text-xs font-sans border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
            className="rounded-[2px] h-8 text-xs font-sans font-semibold gap-1.5"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? "Deleting..." : "Delete Setting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
