"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { apiClient } from "@/lib/api";
import { Customer, CustomerResponse } from "@/lib/customers/types";

import { CustomerSearch } from "./CustomerSearch";
import { CustomerForm } from "./CustomerForm";
import { CustomerPagination } from "./CustomerPagination";

export function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const limit = 10;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get<CustomerResponse>("/customers", {
        params: {
          search: searchTerm || undefined,
          page,
          limit,
        },
      });

      setCustomers(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);

      setError(
        error?.response?.data?.message ||
          "Failed to load customers. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, page]);

  const handleSaved = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setSelectedCustomer(null);
    fetchCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <CustomerSearch
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        isAddOpen={isAddOpen}
        onAddOpenChange={setIsAddOpen}
        onSaved={handleSaved}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium text-gray-900">
                    {customer.name}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        customer.type === "WHOLESALE" ? "default" : "secondary"
                      }
                    >
                      {customer.type}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {customer.contact_number}
                  </TableCell>

                  <TableCell>
                    {customer.wholesale?.company_name ?? "—"}
                  </TableCell>

                  <TableCell className="font-mono">
                    {customer.wholesale
                      ? `₱${customer.wholesale.credit_limit.toLocaleString()}`
                      : "—"}
                  </TableCell>

                  <TableCell className="font-mono">
                    {customer.wholesale
                      ? `₱${customer.wholesale.outstanding_balance.toLocaleString()}`
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          className: "h-8 w-8 p-0",
                        })}
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerPagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setPage}
      />

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);

          if (!open) {
            setSelectedCustomer(null);
          }
        }}
      >
        {selectedCustomer && (
          <CustomerForm
            mode="edit"
            customer={selectedCustomer}
            onSaved={handleSaved}
          />
        )}
      </Dialog>
    </div>
  );
}
