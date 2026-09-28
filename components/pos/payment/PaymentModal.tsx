"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CashPaymentForm, { type CashPaymentDetails } from "./CashPaymentForm";
import GCashPaymentForm, { type GCashPaymentDetails } from "./GCashPaymentForm";
import CreditPaymentForm, { type CreditPaymentDetails } from "./CreditPaymentForm";
import {
  submitCheckout,
  formatPeso,
  type CheckoutPayload,
  type Receipt,
  type PaymentMethod,
} from "@/lib/pos";
import { getErrorMessage } from "@/lib/utils";
import { AlertCircle, Banknote, CreditCard, Loader2, QrCode } from "lucide-react";

export type PaymentTabDetails =
  | CashPaymentDetails
  | GCashPaymentDetails
  | CreditPaymentDetails;

export interface PaymentModalItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentModalCustomer {
  id: string | number;
  name: string;
  type?: "Retail" | "Wholesale" | "RETAIL" | "WHOLESALE";
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
  const [paymentDetails, setPaymentDetails] = useState<Record<string, PaymentTabDetails>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handlePaymentUpdate = useCallback((tabKey: string, details: PaymentTabDetails) => {
    setPaymentDetails((prev) => {
      if (JSON.stringify(prev[tabKey]) === JSON.stringify(details)) {
        return prev;
      }
      return {
        ...prev,
        [tabKey]: details,
      };
    });
  }, []);

  const handleCashChange = useCallback(
    (details: CashPaymentDetails) => handlePaymentUpdate("cash", details),
    [handlePaymentUpdate]
  );

  const handleGCashChange = useCallback(
    (details: GCashPaymentDetails) => handlePaymentUpdate("gcash", details),
    [handlePaymentUpdate]
  );

  const handleCreditChange = useCallback(
    (details: CreditPaymentDetails) => handlePaymentUpdate("credit", details),
    [handlePaymentUpdate]
  );

  // Get active payment details narrowed by payment method
  const currentPayment = paymentDetails[activeTab];
  const cashPayment = currentPayment?.type === "CASH" ? currentPayment : null;
  const gcashPayment = currentPayment?.type === "GCASH" ? currentPayment : null;
  const creditPayment = currentPayment?.type === "CREDIT" ? currentPayment : null;

  // Validation logic based on active payment method
  let isPaymentValid = false;
  let validationMessage = "";

  if (activeTab === "cash") {
    const cashTendered = cashPayment?.cashTendered ?? 0;
    if (cashTendered === 0) {
      validationMessage = "Enter cash tendered to continue.";
    } else if (cashTendered < cartTotal) {
      validationMessage = "Cash tendered is insufficient to cover total.";
    } else {
      isPaymentValid = true;
    }
  } else if (activeTab === "gcash") {
    if (!gcashPayment?.referenceNumber || gcashPayment.referenceNumber.length < 6) {
      validationMessage = "Valid GCash Reference Number is required.";
    } else if (!gcashPayment?.mobileNumber || gcashPayment.mobileNumber.length < 11) {
      validationMessage = "Valid 11-digit GCash mobile number is required.";
    } else {
      isPaymentValid = true;
    }
  } else if (activeTab === "credit") {
    if (creditPayment?.errorMessage) {
      validationMessage = creditPayment.errorMessage;
    } else if (creditPayment?.isValid) {
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

      const isWholesale = activeTab === "credit" || customer?.type?.toUpperCase() === "WHOLESALE";
      const checkoutPayload: CheckoutPayload = {
        transaction_type: isWholesale ? "WHOLESALE" : "RETAIL",
        items: itemsPayload,
        customer_id: activeTab === "credit" ? creditPayment?.customerId : customer?.id ?? null,
        customer_name: activeTab === "credit" ? creditPayment?.customerName : customer?.name ?? null,
        grand_total: cartTotal,
        payment: {
          payment_method: paymentMethod,
          amount_paid: cartTotal,
          cash_tendered: activeTab === "cash" ? cashPayment?.cashTendered : undefined,
          change_given: activeTab === "cash" ? cashPayment?.changeDue : undefined,
          reference_number:
            activeTab === "gcash"
              ? gcashPayment?.referenceNumber
              : activeTab === "credit"
              ? creditPayment?.poNumber
              : undefined,
          mobile_number: activeTab === "gcash" ? gcashPayment?.mobileNumber : undefined,
          credit_due_date: activeTab === "credit" ? creditPayment?.dueDate : undefined,
          po_number: activeTab === "credit" ? creditPayment?.poNumber : undefined,
        },
      };

      // Submit checkout payload to backend API
      const response = await submitCheckout(checkoutPayload);

      if (response.success && response.receipt) {
        onSuccess?.(response.receipt);
        onClose();
      } else {
        setCheckoutError(response.message || "Failed to process checkout. Please try again.");
      }
    } catch (err: unknown) {
      setCheckoutError(getErrorMessage(err, "An unexpected error occurred during checkout."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading text-center">POS Checkout</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
              Select payment method and finalize customer transaction
            </DialogDescription>
          </DialogHeader>

          {/* Cart Total Summary Banner */}
          <div className="bg-foreground text-white p-5 rounded-[4px] text-center my-2 shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
            <p className="text-xs text-muted-foreground/80 uppercase tracking-wider font-medium">
              Total Amount Due
            </p>
            <p className="text-3xl font-extrabold mt-1 text-white font-mono">
              {formatPeso(cartTotal)}
            </p>
            {customer && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Customer: <span className="font-semibold text-white">{customer.name}</span> ({customer.type || "Retail"})
              </p>
            )}
          </div>

          {/* Checkout Error Banner */}
          {checkoutError && (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
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
            <TabsList className="grid w-full grid-cols-3 rounded-[4px] bg-muted p-1">
              <TabsTrigger value="cash" className="flex items-center gap-1.5 py-2 rounded-[2px] text-xs font-medium">
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </TabsTrigger>
              <TabsTrigger value="gcash" className="flex items-center gap-1.5 py-2 rounded-[2px] text-xs font-medium">
                <QrCode className="h-4 w-4" />
                <span>GCash</span>
              </TabsTrigger>
              <TabsTrigger value="credit" className="flex items-center gap-1.5 py-2 rounded-[2px] text-xs font-medium">
                <CreditCard className="h-4 w-4" />
                <span>Credit (AR)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash">
              <CashPaymentForm
                amountDue={cartTotal}
                onPaymentChange={handleCashChange}
              />
            </TabsContent>

            <TabsContent value="gcash">
              <GCashPaymentForm
                amountDue={cartTotal}
                onPaymentChange={handleGCashChange}
              />
            </TabsContent>

            <TabsContent value="credit">
              <CreditPaymentForm
                amountDue={cartTotal}
                initialCustomerId={customer?.type?.toUpperCase() === "WHOLESALE" ? customer.id : undefined}
                onPaymentChange={handleCreditChange}
              />
            </TabsContent>
          </Tabs>

          {/* Validation Notice if not ready to submit */}
          {!isPaymentValid && validationMessage && (
            <p className="text-xs text-amber-600 text-right font-medium">
              {validationMessage}
            </p>
          )}

          {/* Action Footer */}
          <div className="flex justify-end gap-2.5 mt-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-[4px] text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={!isPaymentValid || isSubmitting}
              className="bg-primary hover:bg-primary/80 text-white min-w-[140px] rounded-[4px] text-xs uppercase font-bold tracking-wider"
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
    </>
  );
}