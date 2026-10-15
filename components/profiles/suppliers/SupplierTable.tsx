"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Supplier,
  SupplierFormData,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/api/suppliers";
import { SupplierModal } from "./SupplierModal";
import { SupplierDeleteDialog } from "./SupplierDeleteDialog";

export function SupplierTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Pagination & Filtering state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Toast message state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSuppliers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
      });
      setSuppliers(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (data: SupplierFormData) => {
    try {
      setActionLoading(true);
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, data);
        showFeedback("success", "Supplier updated successfully.");
      } else {
        await createSupplier(data);
        showFeedback("success", "Supplier created successfully.");
      }
      setIsModalOpen(false);
      setSelectedSupplier(null);
      loadData();
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      setActionLoading(true);
      await deleteSupplier(supplierToDelete.id);
      showFeedback("success", "Supplier deleted successfully.");
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
      loadData();
    } catch (err: any) {
      showFeedback("error", err.response?.data?.message || "Failed to delete supplier.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search supplier by name or contact..."
              className="pl-8 bg-muted/50"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
          }}
          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-md border bg-card overflow-x-auto">
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
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => {
                const name = supplier.companyName || supplier.name || "N/A";
                const contact = supplier.contactPerson || "N/A";
                const contactInfo =
                  [supplier.email, supplier.phone].filter(Boolean).join(" • ") || "N/A";
                const leadTime = supplier.leadTimeDays ?? 0;
                const status = supplier.status || "ACTIVE";

                return (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate" title={name}>
                      {name}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={contact}>
                      {contact}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[220px] truncate" title={contactInfo}>
                      {contactInfo}
                    </TableCell>
                    <TableCell className="font-mono">{leadTime} Days</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsModalOpen(true);
                            }}
                          >
                            Edit Supplier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setSupplierToDelete(supplier);
                              setIsDeleteDialogOpen(true);
                            }}
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
      </div>

      {/* Pagination Row */}
      <div className="flex items-center justify-between px-2 pt-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{suppliers.length}</span> of{" "}
          <span className="font-medium">{totalItems}</span> suppliers
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || loading}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedSupplier}
        isLoading={actionLoading}
      />

      <SupplierDeleteDialog
        isOpen={isDeleteDialogOpen}
        supplierName={supplierToDelete?.companyName || supplierToDelete?.name}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}