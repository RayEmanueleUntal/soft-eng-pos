// Historical POS receipt list for browsing completed sales and opening invoices.
// Fetches paginated GET /transactions results with optional search.
// Footer uses shared TablePagination at 15 receipts per page.
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  FileText,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatPeso, getErrorMessage } from "@/lib/utils";
import { fetchTransactionsApi, type TransactionSummary } from "@/lib/pos";
import { PageHeader } from "@/components/ui/pageheader";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE = 15;

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactionsApi({
        page,
        limit: PAGE_SIZE,
        search: searchTerm,
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
  }, [page, searchTerm]);

  const handleRefresh = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

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
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="shrink-0 mt-4 mb-4 flex justify-between">
        <div>
          {/* <Link href="/dashboard/pos">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 pl-0 text-muted-foreground hover:text-foreground text-xs font-sans rounded-[4px]"
            >
              <ArrowLeft className="w-4 h-4" /> Back to POS Terminal
            </Button>
          </Link> */}
          <PageHeader
            header="Historical Transaction Logs"
            subheader="Browse completed sales, search past receipts, and view detailed
            printable invoices."
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 self-start"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div>
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/pos">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 pl-0 text-muted-foreground hover:text-foreground text-xs font-sans rounded-[4px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Terminal
              </Button>
            </Link>
          </div>
          <h1 className="text-[24px] font-bold font-heading tracking-tight flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-primary" /> Historical Transaction
            Logs
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Browse completed sales, search past receipts, and view detailed
            printable invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 rounded-[4px] text-xs border-input hover:bg-muted font-sans"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div> */}

      {/* Search Bar */}
      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Invoice #, Receipt ID or Customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 rounded-[4px] border-input text-xs font-mono"
          />
        </div>
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
                Receipt / Invoice #
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
                        <Eye className="w-3.5 h-3.5" /> View Receipt
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
  );
}
