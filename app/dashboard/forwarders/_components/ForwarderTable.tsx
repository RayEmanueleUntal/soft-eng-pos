// Paginated forwarder profile table for dashboard courier master data.
// Lists company, tracking contact, status and created date with edit/delete actions.
// Header count and pagination live in the page-level DataTableShell.
"use client";

import { Edit2, Trash2, Loader2 } from "lucide-react";
import { Forwarder } from "./types";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/shared/TagBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ForwarderTableProps {
  data: Forwarder[];
  loading: boolean;
  onEdit: (forwarder: Forwarder) => void;
  onDelete: (forwarder: Forwarder) => void;
}

export function ForwarderTable({
  data,
  loading,
  onEdit,
  onDelete,
}: ForwarderTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            Company Name
          </TableHead>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            Tracking Contact Info
          </TableHead>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            Status
          </TableHead>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold">
            Created Date
          </TableHead>
          <TableHead className="font-mono text-xs uppercase tracking-wider font-semibold text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-xs">
        {loading ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-12 text-center text-muted-foreground"
            >
              <div className="flex justify-center items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#0060B2]" />
                <span>Loading forwarders...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-12 text-center text-muted-foreground"
            >
              No forwarders found matching your criteria.
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-accent/40 transition-colors h-[36px]"
            >
              <TableCell className="font-medium text-foreground">
                {item.company_name}
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {item.tracking_contact_info}
              </TableCell>
              <TableCell>
                <TagBadge
                  className={
                    item.is_active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }
                >
                  {item.is_active ? "ACTIVE" : "INACTIVE"}
                </TagBadge>
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    title="Edit Forwarder"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    title="Deactivate / Delete"
                    className="h-7 w-7 rounded-[2px] hover:bg-red-50 text-muted-foreground hover:text-red-700 inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
