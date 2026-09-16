"use client";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CustomerForm } from "./CustomerForm";

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isAddOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CustomerSearch({
  searchTerm,
  onSearchChange,
  isAddOpen,
  onAddOpenChange,
  onSaved,
}: CustomerSearchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search customer..."
          className="bg-muted/50 pl-8"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
        <DialogTrigger
          className={buttonVariants({
            className:
              "cursor-pointer bg-[#6366f1] text-white hover:bg-[#4f46e5]",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </DialogTrigger>

        <CustomerForm mode="add" onSaved={onSaved} />
      </Dialog>
    </div>
  );
}
