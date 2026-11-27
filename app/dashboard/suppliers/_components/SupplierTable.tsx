// Supplier master-data table: rows only. Filtering, pagination, and modals
// live in the page-level hook and shared shells.
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Supplier } from "@/lib/suppliers/suppliers";

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SupplierTable({
  suppliers,
  loading,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="min-w-[180px]">Company Name</TableHead>
          <TableHead className="min-w-[140px]">Contact Person</TableHead>
          <TableHead className="min-w-[200px]">Phone / Email</TableHead>
          <TableHead className="min-w-[120px]">Lead Time</TableHead>
          <TableHead className="min-w-[90px]">Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-8 bg-muted animate-pulse rounded" />
              </TableCell>
            </TableRow>
          ))
        ) : suppliers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center py-8 text-muted-foreground"
            >
              No suppliers found.
            </TableCell>
          </TableRow>
        ) : (
          suppliers.map((supplier) => {
            const name = supplier.companyName || supplier.name || "N/A";
            const contact =
              supplier.contactPerson || supplier.contact_person || "N/A";
            const contactInfo =
              [supplier.email, supplier.phone || supplier.contact_number]
                .filter(Boolean)
                .join(" • ") || "N/A";
            const leadTime =
              supplier.leadTimeDays ?? supplier.lead_time_days ?? 0;
            const status =
              supplier.status ||
              (supplier.is_active ? "ACTIVE" : "INACTIVE");

            return (
              <TableRow key={supplier.id}>
                <TableCell
                  className="font-medium text-foreground max-w-[200px] truncate"
                  title={name}
                >
                  {name}
                </TableCell>
                <TableCell
                  className="max-w-[150px] truncate"
                  title={contact}
                >
                  {contact}
                </TableCell>
                <TableCell
                  className="text-muted-foreground max-w-[220px] truncate"
                  title={contactInfo}
                >
                  {contactInfo}
                </TableCell>
                <TableCell className="font-mono">{leadTime} Days</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold ${
                      status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {status}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={buttonVariants({
                        variant: "ghost",
                        className: "9 w-8 p-0",
                      })}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(supplier)}
                      >
                        Edit Supplier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onDelete(supplier)}
                      >
                        Delete Supplier
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
