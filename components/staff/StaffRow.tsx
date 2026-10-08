"use client";


import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, Loader2 } from "lucide-react";
import { Staff, AssignedRole } from "@/lib/staff/types";

interface StaffRowProps {
  member: Staff;
  onEdit: (staff: Staff) => void;
  onToggleStatus?: (staff: Staff) => void;
  isTogglingStatus?: boolean;
  isFetchingDetails?: boolean;
}

export function StaffRow({
  member,
  onEdit,
  onToggleStatus,
  isTogglingStatus = false,
  isFetchingDetails = false,
}: StaffRowProps) {
  const formatRole = (role: AssignedRole | string) => {
    return String(role)
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
        {member.assigned_role ? (
          <Badge
            variant="outline"
            className="text-[10px] font-mono font-medium rounded-[2px] bg-secondary/80 border-border text-foreground px-1.5 py-0.5"
          >
            {formatRole(member.assigned_role)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs font-sans">None</span>
        )}
      </TableCell>
      <TableCell className="py-2.5">
        <button
          type="button"
          onClick={() => onToggleStatus?.(member)}
          disabled={isTogglingStatus}
          title={`Click to set as ${member.is_active ? "Inactive" : "Active"}`}
          className="focus:outline-none transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer inline-flex"
        >
          <Badge
            className={`text-[10px] font-mono font-semibold uppercase rounded-[2px] px-2 py-0.5 border shadow-none inline-flex items-center gap-1 transition-colors ${
              member.is_active
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            {isTogglingStatus && (
              <Loader2 className="size-2.5 animate-spin text-current" />
            )}
            {member.is_active ? "Active" : "Inactive"}
          </Badge>
        </button>
      </TableCell>
      <TableCell className="py-2.5 text-right pr-4">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isFetchingDetails}
          onClick={() => onEdit(member)}
          title="Edit staff profile"
          className="h-7 w-7 rounded-[2px] hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
        >
          {isFetchingDetails ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <PencilIcon className="size-3.5" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}