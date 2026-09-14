"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CashPaymentForm from "./CashPaymentForm";
import GCashPaymentForm from "./GCashPaymentForm";
import CreditPaymentForm from "./CreditPaymentForm";
import { ReceiptModal } from "./ReceiptModal";
import { submitCheckout, type CheckoutPayload } from "@/lib/pos/mock-payment";
import type { Receipt, PaymentMethod } from "@/lib/pos/receipt-types";
import { formatPeso } from "@/lib/pos/format-currency";
import { AlertCircle, Banknote, CreditCard, Loader2, QrCode } from "lucide-react";

export interface PaymentModalItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentModalCustomer {
  id: string;
  name: string;
  type?: "Retail" | "Wholesale";
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  cartItems?: PaymentModalItem[];
  customer?: PaymentModalCustomer | null;
  onSuccess?: (receipt: Receipt) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartTotal,
  cartItems = [],
  customer = null,
  onSuccess,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<string>("cash");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Post-checkout receipt display state
  const [completedReceipt, setCompletedReceipt] = useState<Receipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handlePaymentUpdate = (tabKey: string, details: any) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [tabKey]: details,
    }));
  };

  // Get the active payment details based on selected tab
  const currentPayment = paymentDetails[activeTab];

  // Validation logic based on active payment method
  let isPaymentValid = false;
  let validationMessage = "";

  if (activeTab === "cash") {
    const cashTendered = currentPayment?.cashTendered ?? 0;
    if (cashTendered === 0) {
      validationMessage = "Enter cash tendered to continue.";
    } else if (cashTendered < cartTotal) {
      validationMessage = "Cash tendered is insufficient to cover total.";
    } else {
      isPaymentValid = true;
    }
  } else if (activeTab === "gcash") {
    if (!currentPayment?.referenceNumber || currentPayment.referenceNumber.length < 6) {
      validationMessage = "Valid GCash Reference Number is required.";
    } else if (!currentPayment?.mobileNumber || currentPayment.mobileNumber.length < 11) {
      validationMessage = "Valid 11-digit GCash mobile number is required.";
    } else {
      isPaymentValid = true;
    }
  } else if (activeTab === "credit") {
    if (currentPayment?.errorMessage) {
      validationMessage = currentPayment.errorMessage;
    } else if (currentPayment?.isValid) {
      isPaymentValid = true;
    } else {
      validationMessage = "Select an eligible wholesale account with sufficient credit.";
    }
  }

  const handleCompleteSale = async () => {
    if (!isPaymentValid || isSubmitting) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      // Determine payment method enum
      const paymentMethodMap: Record<string, PaymentMethod> = {
        cash: "CASH",
        gcash: "GCASH",
        credit: "CREDIT",
      };
      const paymentMethod = paymentMethodMap[activeTab] || "CASH";

      // Build payload matching backend POST /pos/checkout schema
      const itemsPayload = cartItems.length > 0
        ? cartItems.map((item) => ({
            product_id: item.productId ?? item.id ?? 1,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.subtotal,
          }))
        : [
            {
              product_id: 1,
              product_name: "POS Transaction Item",
              quantity: 1,
              unit_price: cartTotal,
              subtotal: cartTotal,
            },
          ];

      const checkoutPayload: CheckoutPayload = {
        transaction_type: activeTab === "credit" || customer?.type === "Wholesale" ? "WHOLESALE" : "RETAIL",
        items: itemsPayload,
        customer_id: activeTab === "credit" ? currentPayment?.customerId : customer?.id ?? null,
        customer_name: activeTab === "credit" ? currentPayment?.customerName : customer?.name ?? null,
        grand_total: cartTotal,
        payment: {
          payment_method: paymentMethod,
          amount_paid: cartTotal,
          cash_tendered: activeTab === "cash" ? currentPayment?.cashTendered : undefined,
          change_given: activeTab === "cash" ? currentPayment?.changeDue : undefined,
          reference_number:
            activeTab === "gcash"
              ? currentPayment?.referenceNumber
              : activeTab === "credit"
              ? currentPayment?.poNumber
              : undefined,
          mobile_number: activeTab === "gcash" ? currentPayment?.mobileNumber : undefined,
          credit_due_date: activeTab === "credit" ? currentPayment?.dueDate : undefined,
          po_number: activeTab === "credit" ? currentPayment?.poNumber : undefined,
        },
      };

      // Submit checkout payload to backend / mock handler
      const response = await submitCheckout(checkoutPayload);

      if (response.success) {
        setCompletedReceipt(response.receipt);
        onClose();
        setShowReceiptModal(true);
        onSuccess?.(response.receipt);
      } else {
        setCheckoutError(response.message || "Failed to process checkout. Please try again.");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setShowReceiptModal(false);
    setCompletedReceipt(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">POS Checkout</DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500">
              Select payment method and finalize customer transaction
            </DialogDescription>
          </DialogHeader>

          {/* Cart Total Summary Banner */}
          <div className="bg-gray-900 text-white p-5 rounded-lg text-center my-2 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              Total Amount Due
            </p>
            <p className="text-3xl font-extrabold mt-1 text-white">
              {formatPeso(cartTotal)}
            </p>
            {customer && (
              <p className="text-xs text-gray-300 mt-1">
                Customer: <span className="font-semibold text-white">{customer.name}</span> ({customer.type || "Retail"})
              </p>
            )}
          </div>

          {/* Checkout Error Banner */}
          {checkoutError && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Payment Methods Tabs */}
          <Tabs
            defaultValue="cash"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash" className="flex items-center gap-1.5 py-2">
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </TabsTrigger>
              <TabsTrigger value="gcash" className="flex items-center gap-1.5 py-2">
                <QrCode className="h-4 w-4" />
                <span>GCash</span>
              </TabsTrigger>
              <TabsTrigger value="credit" className="flex items-center gap-1.5 py-2">
                <CreditCard className="h-4 w-4" />
                <span>Credit (AR)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash">
              <CashPaymentForm
                amountDue={cartTotal}
                onPaymentChange={(details) => handlePaymentUpdate("cash", details)}
              />
            </TabsContent>

            <TabsContent value="gcash">
              <GCashPaymentForm
                amountDue={cartTotal}
                onPaymentChange={(details) => handlePaymentUpdate("gcash", details)}
              />
            </TabsContent>

            <TabsContent value="credit">
              <CreditPaymentForm
                amountDue={cartTotal}
                initialCustomerId={customer?.type === "Wholesale" ? customer.id : undefined}
                onPaymentChange={(details) => handlePaymentUpdate("credit", details)}
              />
            </TabsContent>
          </Tabs>

          {/* Validation Notice if not ready to submit */}
          {!isPaymentValid && validationMessage && (
            <p className="text-xs text-amber-600 text-right">
              {validationMessage}
            </p>
          )}

          {/* Action Footer */}
          <div className="flex justify-end gap-3 mt-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={!isPaymentValid || isSubmitting}
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Sale"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post-Checkout Receipt Modal */}
      {completedReceipt && (
        <ReceiptModal
          open={showReceiptModal}
          onOpenChange={setShowReceiptModal}
          receipt={completedReceipt}
          onNewSale={handleNewSale}
        />
      )}
    </>
  );
}