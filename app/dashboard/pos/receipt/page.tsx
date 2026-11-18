// Historical POS receipt list for browsing completed sales and opening invoices.
// Fetches paginated GET /transactions with search, type, and date-range filters.
// Footer uses shared TablePagination at 15 receipts per page.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertCircle } from "lucide-react";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { fetchTransactionsApi, type TransactionSummary } from "@/lib/pos";
import { PageHeader } from "@/components/ui/pageheader";
import {
  EMPTY_INVOICE_FILTERS,
  InvoiceFilterBar,
  isInvalidInvoiceDateRange,
  type InvoiceListFilters,
} from "./_components/InvoiceFilterBar";

const PAGE_SIZE = 15;

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [filters, setFilters] = useState<InvoiceListFilters>(EMPTY_INVOICE_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangeInvalid = isInvalidInvoiceDateRange(filters);

  const loadTransactions = useCallback(async () => {
    if (rangeInvalid) {
      setTransactions([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactionsApi({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        transaction_type: filters.transactionType || undefined,
        startDate: filters.startDate
          ? new Date(`${filters.startDate}T00:00:00`).toISOString()
          : undefined,
        endDate: filters.endDate
          ? new Date(`${filters.endDate}T23:59:59.999`).toISOString()
          : undefined,
      });
      setTransactions(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load transaction history"));
      setTransactions([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    filters.transactionType,
    filters.startDate,
    filters.endDate,
    rangeInvalid,
  ]);

  const handleRefresh = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  const handleFiltersChange = (next: InvoiceListFilters) => {
    setFilters(next);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const getBadgeVariant = (method: TransactionSummary["paymentMethod"]) => {
    switch (method) {
      case "CASH":
        return "default";
      case "GCASH":
        return "secondary";
      case "CREDIT":
        return "outline";
      case "SPLIT":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="shrink-0 mt-4 mb-4">
        <PageHeader
          header="Invoices"
          subheader="Browse completed sales, search past invoices, and view handle refund/exchanges"
        />
      </div>

      {/* Main Content Card (Search, Refresh, and Table) */}
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
        <InvoiceFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Info subheading */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-heading font-semibold text-foreground">
            Invoice History
          </h2>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Total records: {total}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-[4px] font-sans font-medium">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Logs Table */}
        <div className="border border-input rounded-[4px] bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted border-b border-border">
              <TableRow>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Invoice #
                </TableHead>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Date & Time
                </TableHead>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Customer
                </TableHead>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Payment Method
                </TableHead>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold text-right">
                  Total Amount
                </TableHead>
                <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground text-xs font-sans"
                  >
                    Loading transaction logs...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground text-xs font-sans"
                  >
                    No matching transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const receiptId =
                    tx.id || tx.invoice_number || tx.transactionId || "";
                  return (
                    <TableRow
                      key={tx.id}
                      className="h-[36px] border-b border-border hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {tx.invoice_number || tx.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-sans">
                        {tx.date}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-xs font-sans">
                        {tx.customerName && tx.customerName !== ""
                          ? tx.customerName
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getBadgeVariant(tx.paymentMethod)}
                          className="rounded-[2px] font-mono text-[11px] font-semibold uppercase"
                        >
                          {tx.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs tabular-nums text-foreground">
                        {formatPeso(tx.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/pos/receipt/${receiptId}`)
                          }
                          className="gap-1.5 rounded-[4px] text-xs border-input hover:bg-muted font-sans"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          itemLabel="receipts"
          loading={loading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}