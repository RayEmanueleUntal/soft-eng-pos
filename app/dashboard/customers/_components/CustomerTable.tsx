"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { CheckCircle2, CreditCard, MoreVertical, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getCustomers } from "@/lib/customers/customer-api";
import {
  Customer,
  CustomerFilters,
  CustomerPayment,
  EMPTY_CUSTOMER_FILTERS,
} from "@/lib/customers/types";
import { formatPeso, getErrorMessage } from "@/lib/utils";

import { CustomerFilterBar } from "./CustomerFilterBar";
import { CustomerPagination } from "./CustomerPagination";
import { CustomerPaymentModal } from "./CustomerPaymentModal";
import { AddCustomerModal } from "@/components/customers/AddCustomerModal";

const CUSTOMER_PAGE_LIMIT = 10;

interface PaymentNotice {
  customerName: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
}

export function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({
    ...EMPTY_CUSTOMER_FILTERS,
  });
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(
    null,
  );

  const requestSequence = useRef(0);

  const loadCustomers = useCallback(async () => {
    const requestId = ++requestSequence.current;

    try {
      setLoading(true);
      setError("");

      const result = await getCustomers({
        ...filters,
        page,
        limit: CUSTOMER_PAGE_LIMIT,
      });

      if (requestId !== requestSequence.current) return;

      setCustomers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      if (requestId !== requestSequence.current) return;

      setError(
        getErrorMessage(err, "Failed to load customers. Please try again."),
      );
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [filters, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadCustomers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadCustomers]);

  useEffect(() => {
    if (!paymentNotice) return;

    const timeout = setTimeout(() => {
      setPaymentNotice(null);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [paymentNotice]);

  const handleFiltersChange = (nextFilters: CustomerFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setSelectedCustomer(null);
  };

  const handleSettleCredit = (customer: Customer) => {
    setPaymentCustomer(customer);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (
    payment: CustomerPayment,
    customer: Customer,
  ) => {
    setCustomers((previous) =>
      previous.map((item) =>
        item.id === customer.id && item.wholesale
          ? {
              ...item,
              wholesale: {
                ...item.wholesale,
                outstanding_balance: payment.new_balance,
              },
            }
          : item,
      ),
    );

    setPaymentNotice({
      customerName: customer.name,
      amount: payment.amount_paid,
      previousBalance: payment.previous_balance,
      newBalance: payment.new_balance,
    });
  };

  return (
    <div className="space-y-4">
      <CustomerFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total} customer{total === 1 ? "" : "s"}
        </p>

        <Button
          className="h-8 bg-[#0060B2] hover:bg-[#004888] text-white font-semibold text-xs tracking-wide rounded-sm px-3 flex items-center gap-1.5 shadow-sm"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {paymentNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Payment of {formatPeso(paymentNotice.amount)} recorded for{" "}
              {paymentNotice.customerName}. Balance:{" "}
              {formatPeso(paymentNotice.previousBalance)} →{" "}
              {formatPeso(paymentNotice.newBalance)}.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPaymentNotice(null)}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-500/20"
            aria-label="Dismiss payment notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
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
                  <TableCell className="max-w-[220px] font-medium text-foreground whitespace-normal break-words">
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

                  <TableCell className="max-w-[180px] text-muted-foreground whitespace-normal break-words">
                    {customer.contact_number}
                  </TableCell>

                  <TableCell className="max-w-[220px] whitespace-normal break-words">
                    {customer.wholesale?.company_name ?? "—"}
                  </TableCell>

                  <TableCell className="font-mono tabular-nums">
                    {customer.wholesale
                      ? formatPeso(customer.wholesale.credit_limit)
                      : "—"}
                  </TableCell>

                  <TableCell className="font-mono tabular-nums">
                    {customer.wholesale
                      ? formatPeso(customer.wholesale.outstanding_balance)
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

                        {customer.type === "WHOLESALE" &&
                          customer.wholesale && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleSettleCredit(customer)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Settle Credit
                            </DropdownMenuItem>
                          )}
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

      {isEditOpen && selectedCustomer && (
        <AddCustomerModal
          isOpen={isEditOpen}
          onClose={handleEditClose}
          mode="edit"
          customer={selectedCustomer}
          onSuccess={() => {
            handleEditClose();
            void loadCustomers();
          }}
        />
      )}

      <AddCustomerModal
        isOpen={isAddOpen}
        mode="add"
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          void loadCustomers();
        }}
      />

      {paymentCustomer && (
        <CustomerPaymentModal
          customer={paymentCustomer}
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
