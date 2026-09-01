"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "@/components/pos/PrintableInvoice";
import { apiClient } from "@/lib/api";
import type { Receipt } from "@/lib/pos/receipt-types";
import { mockReceipt } from "@/lib/pos/mock-receipt";
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react";

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
        const response = await apiClient.get<Receipt>(`/pos/receipt/${id}`);
        setReceipt(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Authentication required. Please log in to view receipts.");
        } else if (err.response?.status === 403) {
          setError("Access denied. You don't have permission to view this receipt.");
        } else if (err.response?.status === 404) {
          setError("Receipt not found");
        } else if (err.code === 'ERR_NETWORK') {
          setError("Unable to connect to server. Please check if the backend is running.");
        } else {
          setError("Failed to load receipt. Please try again.");
        }
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
    <div className="flex-1 space-y-6 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900">
            Receipt #{id}
          </h1>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-[#6366f1] animate-spin mb-4" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md text-center">
            <AlertCircle className="h-16 w-16 text-[#6366f1] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error === "Receipt not found" ? "Receipt Not Found" : "Error Loading Receipt"}
            </h2>
            <p className="text-gray-600 mb-6">
              {error === "Receipt not found"
                ? `The receipt with ID #${id} could not be found. It may have been deleted or the ID is incorrect.`
                : "There was a problem loading the receipt. Please try again later."}
            </p>
            <Button
              onClick={handleBack}
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-[#6366f1] bg-white text-[#6366f1]">
                {receipt.transaction_type}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-600">
                #{receipt.transactionId}
              </span>
            </div>

            {/* Printable Invoice Display */}
            <div className="mb-6 flex justify-center">
              <PrintableInvoice receipt={receipt} />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
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