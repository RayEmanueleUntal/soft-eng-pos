"use client";

import React from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Forwarder } from "./types";
import { Button } from "@/components/ui/button";

interface ForwarderTableProps {
  data: Forwarder[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (forwarder: Forwarder) => void;
  onDelete: (forwarder: Forwarder) => void;
}

export function ForwarderTable({
  data,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: ForwarderTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-hidden bg-background">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-border text-[11px] font-mono uppercase tracking-wider text-[#475569]">
              <th className="py-2.5 px-4 font-semibold">Company Name</th>
              <th className="py-2.5 px-4 font-semibold">Tracking Contact Info</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Created Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0060B2]" />
                    <span>Loading forwarders...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No forwarders found matching your criteria.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F8FAFC] transition-colors h-[36px]"
                >
                  <td className="py-2 px-4 font-medium text-foreground">
                    {item.company_name}
                  </td>
                  <td className="py-2 px-4 font-mono text-muted-foreground">
                    {item.tracking_contact_info}
                  </td>
                  <td className="py-2 px-4">
                    {item.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 font-mono text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-4 text-right">
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
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-mono text-muted-foreground">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-2.5 text-xs font-mono"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-2.5 text-xs font-mono"
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}