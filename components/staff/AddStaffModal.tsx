"use client";

import { useState } from "react";
import { Staff, AssignedRole } from "@/lib/staff/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staff: {
    username: string;
    first_name: string;
    last_name: string;
    assigned_role: AssignedRole;
    is_active: boolean;
    password?: string;
    id?: number;
  }) => Promise<void> | void;
  editStaff?: Staff | null;
}

export function AddStaffModal({
  open,
  onOpenChange,
  onSave,
  editStaff,
}: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    username: editStaff?.username || "",
    password: "",
    first_name: editStaff?.first_name || "",
    last_name: editStaff?.last_name || "",
    assigned_role: editStaff?.assigned_role || AssignedRole.CASHIER,
    is_active: editStaff?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const formatRole = (role: AssignedRole) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSelectRole = (role: AssignedRole) => {
    setFormData((prev) => ({
      ...prev,
      assigned_role: role,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Schema Validation
    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!formData.first_name.trim()) {
      setError("First name is required.");
      return;
    }
    if (!formData.last_name.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!editStaff && (!formData.password || formData.password.length < 6)) {
      setError("Password is required and must be at least 6 characters long.");
      return;
    }
    if (editStaff && formData.password && formData.password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        id: editStaff?.id,
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        assigned_role: formData.assigned_role,
        is_active: formData.is_active,
        password: formData.password ? formData.password : undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMsg = axiosErr.response?.data?.message;
      const msg = Array.isArray(rawMsg)
        ? rawMsg.join(", ")
        : rawMsg || "Failed to save staff member.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[4px] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold text-foreground tracking-tight">
            {editStaff ? "Edit Staff Profile" : "Add New Staff"}
          </DialogTitle>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            {editStaff
              ? "Update the staff member's credentials, role, and status."
              : "Fill in the details to register a new staff member profile."}
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
              <label htmlFor="username" className="text-xs font-sans font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setError("");
                }}
                className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-xs font-sans font-medium text-foreground">
                {editStaff ? "New Password (Optional)" : "Password"}
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError("");
                }}
                placeholder={
                  editStaff
                    ? "Leave blank to keep existing password"
                    : "Minimum 6 characters"
                }
                className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                required={!editStaff}
              />
              {editStaff && (
                <p className="text-[10px] text-muted-foreground font-sans">
                  Leave blank to keep the current password.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="first_name" className="text-xs font-sans font-medium text-foreground">
                  First Name
                </label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="last_name" className="text-xs font-sans font-medium text-foreground">
                  Last Name
                </label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-sans font-medium text-foreground">
                Role
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(AssignedRole).map((role) => {
                  const isSelected = formData.assigned_role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-[2px] border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {formatRole(role)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-sans text-muted-foreground">
                Select an assigned role
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-sans font-medium text-foreground">Account Status</label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-[2px] border transition-colors focus-visible:outline-none ${
                    formData.is_active
                      ? "bg-primary border-primary"
                      : "bg-muted border-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-[2px] bg-primary-foreground shadow-xs transition-transform ${
                      formData.is_active ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-xs font-mono font-medium text-foreground uppercase">
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={handleCancel}
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
                ? editStaff
                  ? "Saving..."
                  : "Creating..."
                : editStaff
                ? "Save Changes"
                : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
