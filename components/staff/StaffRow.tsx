"use client";

import { Staff, AssignedRole } from "@/lib/staff/mock-data";
import {TableCell, TableRow} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

interface StaffRowProps {
  member: Staff;
  onEdit: (staff: Staff) => void;
}

export function StaffRow({ member, onEdit }: StaffRowProps) {
  const formatRole = (role: AssignedRole) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <TableRow className="hover:bg-accent/40 border-b border-border transition-colors h-11">
      <TableCell className="font-sans font-medium text-foreground text-xs py-2.5">
        <div>
          <span>{member.first_name} {member.last_name}</span>
          <span className="block font-mono text-[10px] text-muted-foreground font-normal">
            @{member.username}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex flex-wrap gap-1">
          {member.roles.length > 0 ? (
            member.roles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="text-[10px] font-mono font-medium rounded-[2px] bg-secondary/80 border-border text-foreground px-1.5 py-0.5"
              >
                {formatRole(role)}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs font-sans">None</span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2.5">
        <Badge
          className={`text-[10px] font-mono font-semibold uppercase rounded-[2px] px-2 py-0.5 border shadow-none ${
            member.is_active
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
              : "bg-muted text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          {member.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="py-2.5 text-right pr-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(member)}
          className="h-7 w-7 rounded-[2px] hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
        >
          <PencilIcon className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}