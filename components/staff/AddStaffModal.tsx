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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {editStaff ? "Edit Staff Profile" : "Add New Staff"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
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
              <label className="text-sm font-medium text-gray-700">
                Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AssignedRole).map((role) => {
                  const isSelected = formData.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      {formatRole(role)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Select at least one role
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Account Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
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
