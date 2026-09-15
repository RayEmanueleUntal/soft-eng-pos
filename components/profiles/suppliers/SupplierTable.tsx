"use client";

import { useState } from "react";
import { mockSuppliers } from "@/lib/customers/mock-data";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Plus } from "lucide-react";
import {
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function SupplierTable() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredSuppliers = mockSuppliers.filter((s) => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search and Action Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search supplier..." 
            className="pl-8 bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Add Supplier Modal */}
        <Dialog>
          <DialogTrigger className={buttonVariants({ className: "bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Register procurement details and lead times for hardware suppliers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input placeholder="e.g. Manila Industrial Fasteners" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input placeholder="e.g. Jane Smith" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Phone / Email</label>
                <Input placeholder="Contact details" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Delivery Lead Time (Days)</label>
                <Input placeholder="7" type="number" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#6366f1] hover:bg-[#4f46e5]">
                Save Supplier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone / Email</TableHead>
              <TableHead>Lead Time (Days)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium text-gray-900">{supplier.companyName}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.contactInfo}</TableCell>
                  <TableCell className="font-mono">{supplier.leadTimeDays} Days</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">Edit Supplier</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">View Purchase Orders</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}