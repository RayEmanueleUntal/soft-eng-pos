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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    assigned_role: editStaff?.assigned_role || AssignedRole.MANAGER,
    cross_functional_roles: editStaff?.cross_functional_roles || [],
    is_active: editStaff?.is_active ?? true,
  });

  const formatRole = (role: AssignedRole) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCrossRoleToggle = (role: AssignedRole) => {
    setFormData((prev) => {
      const current = prev.cross_functional_roles;
      if (current.includes(role)) {
        return {
          ...prev,
          cross_functional_roles: current.filter((r) => r !== role),
        };
      }
      return {
        ...prev,
        cross_functional_roles: [...current, role],
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editStaff ? "Edit Staff Profile" : "Add New Staff"}
          </DialogTitle>
          <DialogDescription>
            {editStaff
              ? "Update the staff member's information below."
              : "Fill in the details to add a new staff member."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>

            {!editStaff && (
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  First Name
                </label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Last Name
                </label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="assigned_role" className="text-sm font-medium">
                Primary Role
              </label>
              <Select
                value={formData.assigned_role}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigned_role: value as AssignedRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AssignedRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRole(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Cross-Functional Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AssignedRole).map((role) => {
                  if (role === formData.assigned_role) return null;
                  const isSelected = formData.cross_functional_roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleCrossRoleToggle(role)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {formatRole(role)}
                    </button>
                  );
                })}
              </div>
              {formData.cross_functional_roles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No cross-functional roles selected
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Account Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: true })}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    formData.is_active
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: false })}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    !formData.is_active
                      ? "bg-gray-200 text-gray-700 border-gray-300"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {editStaff ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
