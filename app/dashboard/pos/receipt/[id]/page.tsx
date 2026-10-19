"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "@/components/pos";
import { RefundModal } from "@/components/pos/receipt/return/RefundModal";
import { ExchangeModal } from "@/components/pos/receipt/return/ExchangeModal";
import { fetchReceiptApi, type Receipt } from "@/lib/pos";
import { getApprovalRequests, type ApprovalStatus, type ApprovalRequestResponseDto } from "@/lib/approval/approval-api";
import { ArrowLeft, Printer, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [refundApprovalRequests, setRefundApprovalRequests] = useState<ApprovalRequestResponseDto[]>([]);
  const [exchangeApprovalRequests, setExchangeApprovalRequests] = useState<ApprovalRequestResponseDto[]>([]);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Helper function to generate badge text for refunds
  const getRefundBadgeText = () => {
    if (refundApprovalRequests.length === 0) return null;
    if (refundApprovalRequests.length === 1) {
      const req = refundApprovalRequests[0];
      const status = req.status === 'APPROVED' ? 'Refund Approved' : 
                   req.status === 'REJECTED' ? 'Refund Rejected' : 'Pending Refund';
      return status;
    }
    // Multiple refunds
    const pendingCount = refundApprovalRequests.filter(r => r.status === 'PENDING').length;
    const approvedCount = refundApprovalRequests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = refundApprovalRequests.filter(r => r.status === 'REJECTED').length;
    
    if (pendingCount === refundApprovalRequests.length) return `${pendingCount} Pending Refunds`;
    if (approvedCount === refundApprovalRequests.length) return `${approvedCount} Approved Refunds`;
    if (rejectedCount === refundApprovalRequests.length) return `${rejectedCount} Rejected Refunds`;
    
    // Mixed statuses
    const parts = [];
    if (approvedCount > 0) parts.push(`${approvedCount} Approved`);
    if (pendingCount > 0) parts.push(`${pendingCount} Pending`);
    if (rejectedCount > 0) parts.push(`${rejectedCount} Rejected`);
    return `${parts.join(', ')} Refunds`;
  };

  // Helper function to generate badge text for exchanges
  const getExchangeBadgeText = () => {
    if (exchangeApprovalRequests.length === 0) return null;
    if (exchangeApprovalRequests.length === 1) {
      const req = exchangeApprovalRequests[0];
      const status = req.status === 'APPROVED' ? 'Exchange Approved' : 
                   req.status === 'REJECTED' ? 'Exchange Rejected' : 'Pending Exchange';
      return status;
    }
    // Multiple exchanges
    const pendingCount = exchangeApprovalRequests.filter(r => r.status === 'PENDING').length;
    const approvedCount = exchangeApprovalRequests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = exchangeApprovalRequests.filter(r => r.status === 'REJECTED').length;
    
    if (pendingCount === exchangeApprovalRequests.length) return `${pendingCount} Pending Exchanges`;
    if (approvedCount === exchangeApprovalRequests.length) return `${approvedCount} Approved Exchanges`;
    if (rejectedCount === exchangeApprovalRequests.length) return `${rejectedCount} Rejected Exchanges`;
    
    // Mixed statuses
    const parts = [];
    if (approvedCount > 0) parts.push(`${approvedCount} Approved`);
    if (pendingCount > 0) parts.push(`${pendingCount} Pending`);
    if (rejectedCount > 0) parts.push(`${rejectedCount} Rejected`);
    return `${parts.join(', ')} Exchanges`;
  };

  // Helper function to get badge color for refunds
  const getRefundBadgeColor = () => {
    if (refundApprovalRequests.length === 0) return null;
    const allApproved = refundApprovalRequests.every(r => r.status === 'APPROVED');
    const allRejected = refundApprovalRequests.every(r => r.status === 'REJECTED');
    
    if (allApproved) return 'border-green-500 bg-green-500/10 text-green-600';
    if (allRejected) return 'border-red-500 bg-red-500/10 text-red-600';
    return 'border-amber-500 bg-amber-500/10 text-amber-600';
  };

  // Helper function to get badge color for exchanges
  const getExchangeBadgeColor = () => {
    if (exchangeApprovalRequests.length === 0) return null;
    const allApproved = exchangeApprovalRequests.every(r => r.status === 'APPROVED');
    const allRejected = exchangeApprovalRequests.every(r => r.status === 'REJECTED');
    
    if (allApproved) return 'border-green-500 bg-green-500/10 text-green-600';
    if (allRejected) return 'border-red-500 bg-red-500/10 text-red-600';
    return 'border-amber-500 bg-amber-500/10 text-amber-600';
  };

  // Helper function to get rejection reasons
  const getRejectionReasons = () => {
    const reasons: string[] = [];
    refundApprovalRequests.forEach(r => {
      if (r.status === 'REJECTED' && r.rejectionReason) {
        reasons.push(`Refund: ${r.rejectionReason}`);
      }
    });
    exchangeApprovalRequests.forEach(r => {
      if (r.status === 'REJECTED' && r.rejectionReason) {
        reasons.push(`Exchange: ${r.rejectionReason}`);
      }
    });
    return reasons;
  };

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const data = await fetchReceiptApi(id);
        setReceipt(data);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Receipt not found"));
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  // Fetch approval requests for this transaction on page load
  useEffect(() => {
    if (receipt) {
      handleRefreshStatus();
    }
  }, [receipt]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleRefundSuccess = (approvalRequestId: number) => {
    // Just trigger a refresh to fetch the latest approval requests from backend
    handleRefreshStatus();
  };

  const handleExchangeSuccess = (approvalRequestId: number) => {
    // Just trigger a refresh to fetch the latest approval requests from backend
    handleRefreshStatus();
  };

  const handleRefreshStatus = useCallback(async () => {
    setRefreshingStatus(true);
    try {
      console.log('Fetching approval requests...');
      const allRequests = await getApprovalRequests();
      console.log('All approval requests:', allRequests);
      console.log('Receipt transaction ID:', receipt?.transactionId);
      
      // Filter by transaction ID and type if receipt exists
      if (receipt) {
        const transactionId = receipt.transactionId;
        
        const refunds = allRequests.filter(req => 
          req.type === 'REFUND_TRANSACTION' && 
          req.payload?.transactionId === transactionId
        );
        
        const exchanges = allRequests.filter(req => 
          req.type === 'EXCHANGE_TRANSACTION' && 
          req.payload?.transactionId === transactionId
        );
        
        console.log('Filtered refunds:', refunds);
        console.log('Filtered exchanges:', exchanges);
        
        setRefundApprovalRequests(refunds);
        setExchangeApprovalRequests(exchanges);
      } else {
        // If no receipt yet, just don't set anything
        setRefundApprovalRequests([]);
        setExchangeApprovalRequests([]);
      }
    } catch (err) {
      console.error("Failed to fetch approval status:", err);
    } finally {
      setRefreshingStatus(false);
    }
  }, [receipt]);

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
          <p className="text-muted-foreground text-xs font-sans">Loading receipt...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-card rounded-[4px] border border-input p-6 max-w-md text-center shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">
              {error === "Receipt not found" ? "Receipt Not Found" : "Error Loading Receipt"}
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
              {/* Debug: Show counts */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  {refundApprovalRequests.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border border-blue-500 bg-blue-500/10 text-blue-600">
                      Refunds: {refundApprovalRequests.length}
                    </span>
                  )}
                  {exchangeApprovalRequests.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border border-purple-500 bg-purple-500/10 text-purple-600">
                      Exchanges: {exchangeApprovalRequests.length}
                    </span>
                  )}
                </>
              )}
              {getRefundBadgeText() && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border uppercase ${getRefundBadgeColor()}`}>
                  {getRefundBadgeText()}
                </span>
              )}
              {getExchangeBadgeText() && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold border uppercase ${getExchangeBadgeColor()}`}>
                  {getExchangeBadgeText()}
                </span>
              )}
              {(refundApprovalRequests.length > 0 || exchangeApprovalRequests.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={refreshingStatus}
                  className="text-xs h-6 px-2 rounded-[4px]"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${refreshingStatus ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              )}
            </div>
            {getRejectionReasons().length > 0 && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-[4px]">
                {getRejectionReasons().map((reason, idx) => (
                  <div key={idx}><strong>Rejection Reason:</strong> {reason}</div>
                ))}
              </div>
            )}

            {/* Printable Invoice Display */}
            <div className="mb-6 flex justify-center">
              <PrintableInvoice receipt={receipt} />
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
                onClick={() => setRefundModalOpen(true)}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                Process Refund
              </Button>
              <Button
                variant="outline"
                onClick={() => setExchangeModalOpen(true)}
                className="rounded-[4px] text-xs border-input hover:bg-muted"
              >
                Process Exchange
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

      {/* Return Modals */}
      {receipt && (
        <>
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