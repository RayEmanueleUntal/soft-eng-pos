"use client";

import { Staff } from "@/lib/staff/mock-data";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, SearchIcon, FilterIcon, DownloadIcon } from "lucide-react";
import { StaffRow } from "./StaffRow";

interface StaffTableProps {
  staff: Staff[];
  onEdit: (staff: Staff) => void;
  onAdd: () => void;
}

export function StaffTable({ staff, onEdit, onAdd }: StaffTableProps) {
  const activeCount = staff.filter((s) => s.is_active).length;
  const inactiveCount = staff.filter((s) => !s.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header with tabs and action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-[4px] border border-border">
          <Button
            size="sm"
            className="h-8 px-3 text-xs font-sans font-semibold rounded-[2px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            All <span className="font-mono ml-1">({staff.length})</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-sans font-medium rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            Active <span className="font-mono ml-1">({activeCount})</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-sans font-medium rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            Inactive <span className="font-mono ml-1">({inactiveCount})</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs rounded-[2px] border-border text-foreground hover:bg-muted font-sans"
          >
            <DownloadIcon className="size-3.5 text-muted-foreground" />
            Import
          </Button>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8 h-8 w-60 rounded-[2px] text-xs font-sans border-border bg-card placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs rounded-[2px] border-border text-foreground hover:bg-muted font-sans"
          >
            <FilterIcon className="size-3.5 text-muted-foreground" />
            Filter
          </Button>
          <Button
            onClick={onAdd}
            size="sm"
            className="gap-1.5 h-8 text-xs rounded-[2px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs font-sans"
          >
            <PlusIcon className="size-3.5" />
            New Staff
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[4px] border border-border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70 hover:border-l-0 border-b border-border">
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">Employee Name</TableHead>
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">Roles</TableHead>
              <TableHead className="text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9">Account Status</TableHead>
              <TableHead className="w-[100px] text-foreground font-mono text-[11px] font-semibold uppercase tracking-wider h-9 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
        <span>Showing 1-{staff.length} of {staff.length} entries</span>
      </div>
    </div>
  );
}
