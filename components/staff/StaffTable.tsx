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
import { Input } from "@/components/ui/input";
import { PlusIcon, PencilIcon, SearchIcon, FilterIcon, DownloadIcon } from "lucide-react";

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
      {/* Header with tabs and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-primary">
            All ({staff.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-blue-50">
            Active ({activeCount})
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-blue-50">
            Inactive ({inactiveCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="size-4" />
            Import
          </Button>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <FilterIcon className="size-4" />
            Filter
          </Button>
          <Button onClick={onAdd} className="gap-2 bg-blue-500 hover:bg-primary">
            <PlusIcon className="size-4" />
            New Staff
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 hover:bg-blue-50">
              <TableHead className="text-foreground font-semibold">Employee Name</TableHead>
              <TableHead className="text-foreground font-semibold">Roles</TableHead>
              <TableHead className="text-foreground font-semibold">Account Status</TableHead>
              <TableHead className="w-[100px] text-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id} className="hover:bg-blue-50/50">
                <TableCell className="font-medium text-foreground">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.roles.length > 0 ? (
                      member.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
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
                    className={
                      member.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-300"
                        : "bg-accent text-foreground hover:bg-accent border-border"
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
                    className="hover:bg-blue-100"
                  >
                    <PencilIcon className="size-4 text-muted-foreground" />
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
