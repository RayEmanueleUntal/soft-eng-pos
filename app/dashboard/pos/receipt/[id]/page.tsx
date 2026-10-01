"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "@/components/pos";
import { fetchReceiptApi, type Receipt } from "@/lib/pos";
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push("/dashboard");
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
          <h1 className="text-2xl font-bold font-heading text-foreground">
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
            </div>

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
    </div>
  );
}