"use client";

// Invoice detail for a completed POS sale: print, refund, and exchange without the checkout hop.
// Loads GET receipt plus pending/approved return payloads so cashiers see live totals.
// Refund and Exchange open classmate modals directly from this page footer.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailShell } from "@/components/shared/DetailShell";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "./_components/PrintableInvoice";
import { ReceiptSummaryCard } from "./_components/ReceiptSummaryCard";
import { RefundModal } from "./_components/return/RefundModal";
import { ExchangeModal } from "./_components/return/ExchangeModal";
import { fetchReceiptApi, type Receipt } from "@/lib/pos";
import { getApprovalRequests } from "@/lib/approval/approval-api";
import { ArrowLeft, Printer } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

/** Prefers the backend invoice_number, then INV-{transactionId}. */
function getInvoiceHeading(receipt: Receipt | null, routeId: string): string {
  if (!receipt) return `INV-${routeId}`;
  return receipt.invoice_number || `INV-${receipt.transactionId ?? routeId}`;
}

/** Reads credit-cancellation aliases from a pending return breakdown. */
function getPendingCreditAmount(breakdown: Record<string, unknown>): number {
  return Number(
    breakdown.creditDebtCancellation ??
      breakdown.credit_debt_cancellation ??
      breakdown.creditDebtReduction ??
      breakdown.credit_debt_reduction ??
      breakdown.credit ??
      0,
  );
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);
  const [pendingBreakdown, setPendingBreakdown] = useState<any>(null);

  const loadReceiptAndApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      const [receiptResult, approvalsResult] = await Promise.allSettled([
        fetchReceiptApi(id),
        getApprovalRequests(),
      ]);

      if (receiptResult.status === "rejected") {
        throw receiptResult.reason;
      }

      const receiptData = receiptResult.value;
      let pendingFound = false;
      let breakdown: Record<string, unknown> | null = null;

      if (approvalsResult.status === "fulfilled") {
        const txId = Number(receiptData.transactionId);
        const pendingReq = approvalsResult.value.find((req) => {
          if (
            req.status !== "PENDING" ||
            (req.type !== "REFUND_TRANSACTION" &&
              req.type !== "EXCHANGE_TRANSACTION")
          ) {
            return false;
          }
          const p =
            typeof req.payload === "string"
              ? JSON.parse(req.payload)
              : (req.payload ?? {});
          return Number(p.transactionId ?? p.transaction_id) === txId;
        });

        if (pendingReq) {
          pendingFound = true;
          const p =
            typeof pendingReq.payload === "string"
              ? JSON.parse(pendingReq.payload)
              : (pendingReq.payload ?? {});
          breakdown = p.paymentBreakdown ?? p.payment_breakdown ?? null;
        }
      }

      setHasPendingApproval(pendingFound);
      setPendingBreakdown(breakdown);
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
    router.push("/dashboard/pos/receipt");
  };

  const handleRefundSuccess = () => {
    setHasPendingApproval(true);
    loadReceiptAndApprovals();
  };

  const handleExchangeSuccess = () => {
    setHasPendingApproval(true);
    loadReceiptAndApprovals();
  };

  const errorConfig = error
    ? {
        title:
          error === "Receipt not found"
            ? "Receipt Not Found"
            : "Error Loading Receipt",
        message:
          error === "Receipt not found"
            ? `The receipt with ID #${id} could not be found. It may have been deleted or the ID is incorrect.`
            : "There was a problem loading the receipt. Please try again later.",
        actionLabel: "Back to Receipts",
        onAction: handleBack,
      }
    : null;

  return (
    <DetailShell
      title={getInvoiceHeading(receipt, id)}
      backLabel="Back to Invoices"
      onBack={handleBack}
      loading={loading}
      loadingMessage="Loading receipt..."
      error={errorConfig}
    >
      {receipt && (
        <>
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

              {/* Pending Return Breakdown Card */}
              {hasPendingApproval && pendingBreakdown && (
                <div className="mb-6 rounded-[4px] border border-amber-300 bg-amber-50/50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                    <span className="font-heading font-semibold text-amber-800 uppercase tracking-wider">
                      Pending Refund / Exchange Breakdown
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      PENDING APPROVAL
                    </span>
                  </div>
                  <div
                    className={`grid grid-cols-1 gap-3 pt-1 ${
                      getPendingCreditAmount(pendingBreakdown) !== 0
                        ? "sm:grid-cols-2"
                        : ""
                    }`}
                  >
                    {getPendingCreditAmount(pendingBreakdown) !== 0 && (
                      <div className="rounded border border-amber-200 bg-white/80 p-2.5">
                        <span className="text-muted-foreground block text-[11px] mb-1">
                          Credit Debt Cancellation
                        </span>
                        <span className="font-mono text-sm font-bold text-foreground">
                          ₱
                          {getPendingCreditAmount(
                            pendingBreakdown,
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="rounded border border-amber-200 bg-white/80 p-2.5">
                      <span className="text-muted-foreground block text-[11px] mb-1">
                        Cash Payout
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        ₱
                        {Number(
                          pendingBreakdown.cashPayout ??
                            pendingBreakdown.cash_payout ??
                            pendingBreakdown.cashPayoutAmount ??
                            pendingBreakdown.cash_payout_amount ??
                            pendingBreakdown.cash ??
                            0,
                        ).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  {(pendingBreakdown.totalRefund !== undefined ||
                    pendingBreakdown.total_refund !== undefined ||
                    pendingBreakdown.totalRefundAmount !== undefined ||
                    pendingBreakdown.total_refund_amount !== undefined) && (
                    <div className="flex justify-between pt-1 border-t border-amber-200 font-medium">
                      <span className="text-muted-foreground">
                        Total Refund Amount
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        ₱
                        {Number(
                          pendingBreakdown.totalRefund ??
                            pendingBreakdown.total_refund ??
                            pendingBreakdown.totalRefundAmount ??
                            pendingBreakdown.total_refund_amount ??
                            0,
                        ).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt Summary Display */}
              <div className="mb-6 flex justify-center">
                <div className="w-full max-w-lg bg-card border border-input rounded-[4px] p-4 shadow-[0px_2px_0px_rgba(15,23,42,0.06)]">
                  <ReceiptSummaryCard receipt={receipt} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-2.5 pt-4 border-t border-border">
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
                  onClick={() => setRefundModalOpen(true)}
                  disabled={hasPendingApproval}
                  className="rounded-[4px] text-xs border-input hover:bg-muted"
                >
                  Refund
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExchangeModalOpen(true)}
                  disabled={hasPendingApproval}
                  className="rounded-[4px] text-xs border-input hover:bg-muted"
                >
                  Exchange
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-primary hover:bg-primary/80 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
            </div>

            {/* Hidden Printable Invoice for Print */}
            <div aria-hidden="true" className="hidden print:block">
              <PrintableInvoice receipt={receipt} id="printable-receipt" />
            </div>
          </div>

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
    </DetailShell>
  );
}