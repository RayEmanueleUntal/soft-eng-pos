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
        assigned_role: staffData.assigned_role!,
        cross_functional_roles: staffData.cross_functional_roles || [],
        is_active: staffData.is_active ?? true,
      };
      setStaff((prev) => [...prev, newStaff]);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Staff Profiling</h1>
        <p className="text-muted-foreground">
          Manage staff profiles and cross-functional role assignments
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
