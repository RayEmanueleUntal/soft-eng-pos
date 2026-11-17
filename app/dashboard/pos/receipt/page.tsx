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
import { Label } from "@/components/ui/label";

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactionsApi();
      setTransactions(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load transaction history"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchTransactionsApi()
      .then((data) => {
        if (!ignore) {
          setTransactions(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(getErrorMessage(err, "Failed to load transaction history"));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const filteredTransactions = safeTransactions.filter((tx) => {
    const search = searchTerm.toLowerCase();
    const idMatch = (
      tx.invoice_number ||
      String(tx.id || "") ||
      String(tx.transactionId || "")
    )
      .toLowerCase()
      .includes(search);
    const customerMatch = (tx.customerName || "")
      .toLowerCase()
      .includes(search);
    return idMatch || customerMatch;
  });

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
        subheader="Browse completed sales, search past invoices, and handle refunds or exchanges."
      />
    </div>

    {/* Main Content Card (Search, Refresh, and Table) */}
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
      {/* Toolbar matching InventoryFilterBar style */}
      <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by Invoice #, Receipt ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm font-sans focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 gap-2 rounded-[2px]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/*info subheading*/}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-heading font-semibold text-foreground">
          Invoice History
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          Total records: {filteredTransactions.length}
          {searchTerm && ` (of ${safeTransactions.length})`}
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
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground text-xs font-sans"
                >
                  No matching transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
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
    </div>
  </div>
);
}
