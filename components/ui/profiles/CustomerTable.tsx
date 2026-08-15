"use client";

import { useState } from "react";
import { mockCustomers } from "@/lib/customers/mock-data";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export function CustomerTable() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredCustomers = mockCustomers.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search and Action Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customer..." 
            className="pl-8 bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Add Customer Modal */}
        <Dialog>
          <DialogTrigger className={buttonVariants({ className: "bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Customers
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Fill in the details below to register a retail or wholesale customer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Customer / Business Name</label>
                <Input placeholder="e.g. BuildRite Construction" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Customer Type</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Contact Info</label>
                <Input placeholder="Email or Phone number" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Credit Limit (PHP)</label>
                <Input placeholder="0" type="number" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#6366f1] hover:bg-[#4f46e5]">
                Save Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium text-gray-900">{customer.name}</TableCell>
                  <TableCell>
                    <Badge variant={customer.type === "Wholesale" ? "default" : "secondary"}>
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.contactInfo}</TableCell>
                  <TableCell className="font-mono">
                    {customer.creditLimit > 0 
                      ? `₱${customer.creditLimit.toLocaleString()}` 
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        customer.isActive 
                          ? "text-green-700 bg-green-50 border-green-200" 
                          : "text-red-700 bg-red-50 border-red-200"
                      }
                    >
                      {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer">Deactivate</DropdownMenuItem>
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