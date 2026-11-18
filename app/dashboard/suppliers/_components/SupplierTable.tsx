// Supplier master-data table for procurement contacts and lead-time records.
// Handles search, status filter, create/edit/delete, and server-backed paging.
// Footer uses shared TablePagination at 15 rows per page.
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Search, MoreVertical, Plus } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
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
} from "@/lib/suppliers/suppliers";
import { SupplierModal } from "./SupplierModal";
import { SupplierDeleteDialog } from "./SupplierDeleteDialog";
import { Label } from "@/components/ui/label";
import { SortSelect, SortKey } from "@/components/ui/sort-select";
import { mapSupplierSortKeyToApiParams } from "@/lib/utils/sort";

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
  const [sortOrder, setSortOrder] = useState<SortKey>("DEFAULT");
  const pageSize = 15;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  // Toast message state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const sortParams = mapSupplierSortKeyToApiParams(sortOrder);
      const res = await fetchSuppliers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        ...sortParams,
      });
      setSuppliers(res.data);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err: any) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to load suppliers.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, sortOrder]);

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
      const res = await deleteSupplier(supplierToDelete.id);
      showFeedback(
        "success",
        res.message || "Supplier processed successfully.",
      );
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);

      // If permanently deleted and it was the only item on a page > 1, step back a page
      if (!res.deactivated && suppliers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        loadData();
      }
    } catch (err: any) {
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to delete supplier.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  //for parsing status
  const STATUS_LABELS: Record<string, string> = {
    ALL: "All Status",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
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
      <div className="space-y-4">
        <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search supplier by name or contact..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Supplier Status + Filters Dropdown */}
          <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
            {/* Supplier Status */}
            <div className="flex flex-col gap-2">
              <Label>Supplier Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  if (val) setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px] !h-9">
                  <SelectValue placeholder="Filter by Status">
                    {STATUS_LABELS[statusFilter] ?? "All Status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters (Sort) */}
            <SortSelect
              value={sortOrder}
              onChange={(val) => {
                setSortOrder(val);
                setCurrentPage(1);
              }}
              showDefaultOption
              options={["NAME_ASC", "NAME_DESC", "STOCK_ASC", "STOCK_DESC"]}
              labelOverrides={{
                DEFAULT: { menuLabel: "Default Order" },
                STOCK_ASC: {
                  shortLabel: "Lead Low-High",
                  menuLabel: "Lead Time Low to High",
                },
                STOCK_DESC: {
                  shortLabel: "Lead High-Low",
                  menuLabel: "Lead Time High to Low",
                },
              }}
              triggerClassName="w-full sm:w-[175px] !h-9"
            />
          </div>

          {/* Big Blue Button */}
          <div className="lg:col-start-5 flex lg:justify-end">
            <Button
              onClick={() => {
                setSelectedSupplier(null);
                setIsModalOpen(true);
              }}
              className="h-9 px-4 font-semibold text-xs tracking-wider bg-[#0060B2] hover:bg-[#004888] text-white rounded-md shadow-none"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/*info subheading */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Supplier Profile List
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {totalItems}
        </span>
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

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        itemLabel="suppliers"
        loading={loading}
        onPageChange={setCurrentPage}
      />

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
