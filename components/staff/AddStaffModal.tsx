"use client";

import { useState } from "react";
import { Staff, AssignedRole } from "@/lib/staff/mock-data";
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

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staff: Partial<Staff>) => void;
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
    roles: editStaff?.roles || [AssignedRole.MANAGER],
    is_active: editStaff?.is_active ?? true,
  });

  const formatRole = (role: AssignedRole) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleRoleToggle = (role: AssignedRole) => {
    setFormData((prev) => {
      const current = prev.roles;
      if (current.includes(role)) {
        // Prevent deselecting the last role
        if (current.length === 1) return prev;
        return {
          ...prev,
          roles: current.filter((r) => r !== role),
        };
      }
      return {
        ...prev,
        roles: [...current, role],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editStaff?.id,
      password_hash: editStaff?.password_hash || "hashed_password",
    });
    onOpenChange(false);
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
              ? "Update the staff member's credentials, roles, and status."
              : "Fill in the details to register a new staff member profile."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <label htmlFor="username" className="text-xs font-sans font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                required
              />
            </div>

            {!editStaff && (
              <div className="grid gap-1.5">
                <label htmlFor="password" className="text-xs font-sans font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-8 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  required
                />
              </div>
            )}

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
                Roles
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(AssignedRole).map((role) => {
                  const isSelected = formData.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
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
                Select at least one role
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
              onClick={handleCancel}
              className="rounded-[2px] h-8 text-xs font-sans border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-[2px] h-8 text-xs font-sans font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              {editStaff ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
