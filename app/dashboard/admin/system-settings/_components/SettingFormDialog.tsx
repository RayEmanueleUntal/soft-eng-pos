// Create / edit dialog for the admin System Settings screen of the POS system.
// Create sends POST /system-settings { key, value, description? }; edit sends PATCH /system-settings/{key}.
// Validates input before calling the API and shows API errors inside the dialog.
"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createSystemSetting,
  SystemSetting,
  updateSystemSetting,
} from "@/lib/admin/system-settings";

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

const FIELD_CLASS =
  "rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary";

interface SettingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: SystemSetting | null;
  onSaved: (saved: SystemSetting, mode: "create" | "edit") => void;
}

// Renders the add/edit setting form; `setting` null means create mode.
export function SettingFormDialog({
  open,
  onOpenChange,
  setting,
  onSaved,
}: SettingFormDialogProps) {
  const isEdit = setting !== null;
  const [key, setKey] = useState(setting?.key ?? "");
  const [value, setValue] = useState(setting?.value ?? "");
  const [description, setDescription] = useState(setting?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Returns a validation message, or an empty string when the form is valid.
  function validate(): string {
    if (!isEdit) {
      const trimmedKey = key.trim();
      if (!trimmedKey) return "Key is required.";
      if (!KEY_PATTERN.test(trimmedKey)) {
        return "Key must use uppercase letters, numbers, and underscores, for example RETURN_WINDOW_DAYS.";
      }
    }
    if (!value.trim()) return "Value is required.";
    return "";
  }

  // Validates, then creates or updates the setting and reports the saved record.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const saved = isEdit
        ? await updateSystemSetting(setting.key, {
            value: value.trim(),
            description: description.trim(),
          })
        : await createSystemSetting({
            key: key.trim(),
            value: value.trim(),
            description: description.trim(),
          });
      onSaved(saved, isEdit ? "edit" : "create");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the setting.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[4px] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold text-foreground tracking-tight">
            {isEdit ? "Edit Setting" : "Add Setting"}
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            {isEdit
              ? "Update this setting's value and description. The key cannot be changed."
              : "Create a new store-wide setting. Values are stored as text."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-xs font-sans p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[2px] mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <label htmlFor="setting-key" className="text-xs font-sans font-medium text-foreground">
                Key
              </label>
              {isEdit ? (
                <p
                  id="setting-key"
                  className="h-8 flex items-center px-2.5 rounded-[2px] border border-border bg-muted font-mono text-xs text-foreground"
                >
                  {setting.key}
                </p>
              ) : (
                <Input
                  id="setting-key"
                  value={key}
                  placeholder="RETURN_WINDOW_DAYS"
                  autoComplete="off"
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError("");
                  }}
                  className={`h-8 font-mono ${FIELD_CLASS}`}
                />
              )}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="setting-value" className="text-xs font-sans font-medium text-foreground">
                Value
              </label>
              <Input
                id="setting-value"
                value={value}
                placeholder="14"
                autoComplete="off"
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                className={`h-8 font-mono ${FIELD_CLASS}`}
              />
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="setting-description"
                className="text-xs font-sans font-medium text-foreground"
              >
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="setting-description"
                value={description}
                placeholder="What this setting controls"
                rows={3}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError("");
                }}
                className={`min-h-[72px] ${FIELD_CLASS}`}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="rounded-[2px] h-8 text-xs font-sans border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="rounded-[2px] h-8 text-xs font-sans font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Add Setting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
