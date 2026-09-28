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

  const filteredTransactions = transactions.filter((tx) => {
    const search = searchTerm.toLowerCase();
    const idMatch = (tx.invoice_number || tx.id || tx.transactionId || "").toLowerCase().includes(search);
    const customerMatch = tx.customerName.toLowerCase().includes(search);
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
              <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Terminal
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-primary" /> Historical Transaction Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse completed sales, search past receipts, and view detailed printable invoices.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
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
            className="pl-9"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[4px]">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt / Invoice #</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading transaction logs...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No matching transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const receiptId = tx.id || tx.invoice_number || tx.transactionId || "";
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono font-semibold">
                      {tx.invoice_number || tx.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tx.date}</TableCell>
                    <TableCell className="font-medium">{tx.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(tx.paymentMethod)}>
                        {tx.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold font-mono">
                      ₱{tx.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/pos/receipt/${receiptId}`)}
                        className="gap-1.5"
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