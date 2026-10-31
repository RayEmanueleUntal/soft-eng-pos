"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "./_components/PrintableInvoice";
import { ReceiptModal } from "./_components/ReceiptModal";
import { ReceiptSummaryCard } from "./_components/ReceiptSummaryCard";
import { RefundModal } from "./_components/return/RefundModal";
import { ExchangeModal } from "./_components/return/ExchangeModal";
import {
  fetchReceiptApi,
  type Receipt,
  type ReceiptReturn,
  type ReceiptExchange,
} from "@/lib/pos";
import {
  getApprovalRequests,
  type ApprovalRequestResponseDto,
} from "@/lib/approval/approval-api";
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);

  const loadReceiptAndApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch base receipt from API
      const receiptData = await fetchReceiptApi(id);

      // Check approvals to see if there are pending or approved returns/exchanges
      let pendingFound = false;
      try {
        const approvals = await getApprovalRequests();
        const txId = receiptData.transactionId;

        const relevant = approvals.filter((req) => {
          const reqTxId = req.payload?.transactionId;
          return reqTxId === txId || String(reqTxId) === String(txId);
        });

        pendingFound = relevant.some(
          (req) =>
            req.status === "PENDING" &&
            (req.type === "REFUND_TRANSACTION" ||
              req.type === "EXCHANGE_TRANSACTION"),
        );

        // Merge any approved returns/exchanges if not already present on receiptData
        const approvedRefunds = relevant.filter(
          (req) =>
            req.status === "APPROVED" && req.type === "REFUND_TRANSACTION",
        );
        const approvedExchanges = relevant.filter(
          (req) =>
            req.status === "APPROVED" && req.type === "EXCHANGE_TRANSACTION",
        );

        if (
          approvedRefunds.length > 0 &&
          (!receiptData.returns || receiptData.returns.length === 0)
        ) {
          receiptData.returns = approvedRefunds.map((req, idx) => {
            const p = req.payload || {};
            const item = receiptData.items.find(
              (it) => it.productId === p.productId,
            );
            const qty = p.quantity || 1;
            const unitPrice = item ? item.applied_price : 0;
            const refundAmount =
              p.refundAmount ?? p.refund_amount ?? unitPrice * qty;

            return {
              id: typeof req.id === "number" ? req.id : idx + 1,
              productId: p.productId,
              product_name:
                p.productName ||
                p.product_name ||
                item?.product_name ||
                "Returned Item",
              quantity: qty,
              date: req.updatedAt || req.createdAt || new Date().toISOString(),
              defect_reason: p.reason || p.defect_reason || "Return",
              refund_amount: refundAmount,
              processed_by_staff: String(
                req.reviewedById || req.requestedById || "Staff",
              ),
            };
          });

          // Mark already_returned_qty on corresponding receipt items
          approvedRefunds.forEach((req) => {
            const p = req.payload || {};
            const it = receiptData.items.find(
              (item) => item.productId === p.productId,
            );
            if (it) {
              it.already_returned_qty =
                (it.already_returned_qty || 0) + (p.quantity || 1);
            }
          });
        }

        if (
          approvedExchanges.length > 0 &&
          (!receiptData.exchanges || receiptData.exchanges.length === 0)
        ) {
          receiptData.exchanges = approvedExchanges.map((req, idx) => {
            const p = req.payload || {};
            const item = receiptData.items.find(
              (it) => it.productId === p.productId,
            );
            return {
              id: typeof req.id === "number" ? req.id : idx + 1,
              productId: p.newProductId || p.productId,
              product_name:
                p.newProductName || item?.product_name || "Exchanged Item",
              quantity: p.newQuantity || p.quantity || 1,
              date: req.updatedAt || req.createdAt || new Date().toISOString(),
              price_difference: p.price_difference ?? p.priceDifference ?? 0,
              is_within_7_days: true,
            };
          });
        }
      } catch (approvalErr) {
        console.warn("Could not load approvals:", approvalErr);
      }

      setHasPendingApproval(pendingFound);
      setReceipt(receiptData);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Receipt not found"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceiptAndApprovals();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleRefundSuccess = () => {
    setHasPendingApproval(true);
    loadReceiptAndApprovals();
  };

  const handleExchangeSuccess = () => {
    setHasPendingApproval(true);
    loadReceiptAndApprovals();
  };

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-[4px] text-xs"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-[24px] font-bold font-heading tracking-tight text-foreground">
            Receipt #{id}
          </h1>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-xs font-sans">
            Loading receipt...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-card rounded-[4px] border border-input p-6 max-w-md text-center shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">
              {error === "Receipt not found"
                ? "Receipt Not Found"
                : "Error Loading Receipt"}
            </h2>
            <p className="text-muted-foreground text-xs mb-6 font-sans">
              {error === "Receipt not found"
                ? `The receipt with ID #${id} could not be found. It may have been deleted or the ID is incorrect.`
                : "There was a problem loading the receipt. Please try again later."}
            </p>
            <Button
              onClick={handleBack}
              className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && receipt && (
        <div className="space-y-6">
          {/* Receipt Card */}
          <div className="bg-card rounded-[4px] border border-input p-6 shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border border-primary bg-primary/10 text-primary uppercase">
                {receipt.transaction_type}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border border-border bg-muted text-muted-foreground">
                #{receipt.transactionId}
              </span>
              {hasPendingApproval && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border border-amber-500 bg-amber-500/10 text-amber-600 uppercase">
                  Pending Return
                </span>
              )}
            </div>

            {/* Printable Invoice or Rich Receipt Summary Display */}
            <div className="mb-6 flex justify-center">
              {(receipt.returns && receipt.returns.length > 0) ||
              (receipt.exchanges && receipt.exchanges.length > 0) ? (
                <div className="w-full max-w-lg bg-card border border-input rounded-[4px] p-4 shadow-[0px_2px_0px_rgba(15,23,42,0.06)]">
                  <ReceiptSummaryCard receipt={receipt} />
                </div>
              ) : (
                <PrintableInvoice receipt={receipt} />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => setSummaryModalOpen(true)}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                Process Refund / Exchange
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            </div>
          </div>

          {/* Hidden Printable Invoice for Print */}
          <div aria-hidden="true" className="hidden print:block">
            <PrintableInvoice receipt={receipt} id="printable-receipt" />
          </div>
        </div>
      )}

      {/* Return Modals & Summary Modal */}
      {receipt && (
        <>
          <ReceiptModal
            open={summaryModalOpen}
            onOpenChange={setSummaryModalOpen}
            receipt={receipt}
            onNewSale={() => router.push("/dashboard/pos")}
            onProcessRefund={() => {
              setSummaryModalOpen(false);
              setRefundModalOpen(true);
            }}
            onProcessExchange={() => {
              setSummaryModalOpen(false);
              setExchangeModalOpen(true);
            }}
          />
          <RefundModal
            open={refundModalOpen}
            onOpenChange={setRefundModalOpen}
            receipt={receipt}
            onSuccess={handleRefundSuccess}
          />
          <ExchangeModal
            open={exchangeModalOpen}
            onOpenChange={setExchangeModalOpen}
            receipt={receipt}
            onSuccess={handleExchangeSuccess}
          />
        </>
      )}
    </div>
  );
}
