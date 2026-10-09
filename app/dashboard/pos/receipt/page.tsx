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
import { Search, Eye, FileText, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { fetchTransactionsApi, type TransactionSummary } from "@/lib/pos";

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
    const idMatch = (tx.invoice_number || String(tx.id || "") || String(tx.transactionId || "")).toLowerCase().includes(search);
    const customerMatch = (tx.customerName || "").toLowerCase().includes(search);
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
      default:
        return "default";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/pos">
              <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground hover:text-foreground text-xs font-sans rounded-[4px]">
                <ArrowLeft className="w-4 h-4" /> Back to Terminal
              </Button>
            </Link>
          </div>
          <h1 className="text-[24px] font-bold font-heading tracking-tight flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-primary" /> Historical Transaction Logs
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Browse completed sales, search past receipts, and view detailed printable invoices.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 rounded-[4px] text-xs border-input hover:bg-muted font-sans">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Invoice #, Receipt ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Receipt / Invoice #</TableHead>
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Date & Time</TableHead>
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Customer</TableHead>
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Payment Method</TableHead>
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold text-right">Total Amount</TableHead>
              <TableHead className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-sans">
                  Loading transaction logs...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-sans">
                  No matching transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const receiptId = tx.id || tx.invoice_number || tx.transactionId || "";
                return (
                  <TableRow key={tx.id} className="h-[36px] border-b border-border hover:bg-accent hover:border-l-[2px] hover:border-l-primary transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {tx.invoice_number || tx.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-sans">{tx.date}</TableCell>
                    <TableCell className="font-medium text-foreground text-xs font-sans">{tx.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(tx.paymentMethod)} className="rounded-[2px] font-mono text-[11px] font-semibold uppercase">
                        {tx.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold font-mono text-xs tabular-nums text-foreground">
                      ₱{tx.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/pos/receipt/${receiptId}`)}
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
    </div>
  );
}