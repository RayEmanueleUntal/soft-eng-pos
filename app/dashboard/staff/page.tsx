"use client";

import { useState } from "react";
import { Staff, mockStaffData } from "@/lib/staff/mock-data";
import { StaffTable } from "@/components/staff/StaffTable";
import { AddStaffModal } from "@/components/staff/AddStaffModal";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>(mockStaffData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);

  const handleAddStaff = () => {
    setEditStaff(null);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (staffData: Partial<Staff>) => {
    if (editStaff) {
      // Update existing staff
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editStaff.id ? { ...s, ...staffData } : s
        )
      );
    } else {
      // Add new staff
      const newStaff: Staff = {
        id: Math.max(...staff.map((s) => s.id)) + 1,
        username: staffData.username || "",
        password_hash: staffData.password_hash || "hashed_password",
        first_name: staffData.first_name || "",
        last_name: staffData.last_name || "",
        roles: staffData.roles || [],
        is_active: staffData.is_active ?? true,
      };
      setStaff((prev) => [...prev, newStaff]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-background min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h1 className="text-[24px] font-heading font-bold tracking-tight text-foreground">
          Staff Management
        </h1>
        <p className="text-xs font-sans text-muted-foreground">
          Manage employee profiles, assigned system roles, and account access status.
        </p>
      </div>

      <StaffTable
        staff={staff}
        onEdit={handleEditStaff}
        onAdd={handleAddStaff}
      />

      <AddStaffModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveStaff}
        editStaff={editStaff}
      />
    </div>
  );
}
