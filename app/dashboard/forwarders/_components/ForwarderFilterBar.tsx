"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ForwarderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenCreateModal: () => void;
}

export function ForwarderFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenCreateModal,
}: ForwarderFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company name or contact info..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <Select 
          value={statusFilter} 
          onValueChange={(val) => onStatusFilterChange(val ?? "all")}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Forwarder Button */}
      <Button
        onClick={onOpenCreateModal}
        className="h-9 px-4 font-semibold text-xs tracking-wider uppercase bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Forwarder
      </Button>
    </div>
  );
}