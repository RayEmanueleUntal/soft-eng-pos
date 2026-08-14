"use client";

import { Staff, AssignedRole } from "@/lib/staff/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon } from "lucide-react";

interface StaffTableProps {
  staff: Staff[];
  onEdit: (staff: Staff) => void;
  onAdd: () => void;
}

export function StaffTable({ staff, onEdit, onAdd }: StaffTableProps) {
  const formatRole = (role: AssignedRole) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const activeCount = staff.filter((s) => s.is_active).length;
  const inactiveCount = staff.filter((s) => !s.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header with tabs and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
            All ({staff.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted">
            Active ({activeCount})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted">
            Inactive ({inactiveCount})
          </button>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <PlusIcon className="size-4" />
          New Staff
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Primary Role</TableHead>
              <TableHead>Cross-Functional Roles</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{formatRole(member.assigned_role)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.cross_functional_roles.length > 0 ? (
                      member.cross_functional_roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {formatRole(role)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={member.is_active ? "default" : "secondary"}
                    className={
                      member.is_active
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(member)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-{staff.length} of {staff.length} entries</span>
      </div>
    </div>
  );
}
