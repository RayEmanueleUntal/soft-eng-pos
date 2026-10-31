"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CustomerSearch({
  searchTerm,
  onSearchChange,
}: CustomerSearchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search customer..."
          className="bg-muted/50 pl-8"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
}
