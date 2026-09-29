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
import { AlertCircle, Banknote, CreditCard, Loader2, QrCode } from "lucide-react";
import CashPaymentForm from "./CashPaymentForm";
import GCashPaymentForm from "./GCashPaymentForm";
import CreditPaymentForm from "./CreditPaymentForm";
import { PaymentTotalBanner } from "./PaymentTotalBanner";
import {
  submitCheckout,
  buildCheckoutPayload,
  type PaymentTabDetails,
  type PaymentModalItem,
  type PaymentModalCustomer,
  type Receipt,
} from "@/lib/pos";
import { getErrorMessage } from "@/lib/utils";

// Re-export types so existing imports across components remain intact
export type { PaymentTabDetails, PaymentModalItem, PaymentModalCustomer };

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  cartItems?: PaymentModalItem[];
  customer?: PaymentModalCustomer | null;
  onSuccess?: (receipt: Receipt) => void;
}

interface PaymentTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  wholesaleOnly?: boolean;
}

const PAYMENT_TABS: PaymentTabItem[] = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "gcash", label: "GCash", icon: QrCode },
  { id: "credit", label: "Credit (AR)", icon: CreditCard, wholesaleOnly: true },
];

export default function PaymentModal({
  isOpen,
  onClose,
  cartTotal,
  cartItems = [],
  customer = null,
  onSuccess,
}: PaymentModalProps) {
  const isRetail = customer?.type?.toUpperCase() === "RETAIL";
  const availableTabs = PAYMENT_TABS.filter((tab) => !tab.wholesaleOnly || !isRetail);

  const [activeTab, setActiveTab] = useState<string>("cash");
  const [detailsMap, setDetailsMap] = useState<Record<string, PaymentTabDetails>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Event-driven reset to prevent leaking previous transaction data without triggering cascading renders
  const handleClose = () => {
    if (isSubmitting) return;
    setActiveTab("cash");
    setDetailsMap({});
    setCheckoutError(null);
    setIsSubmitting(false);
    onClose();
  };

  // Fallback to cash if selected tab is credit for retail
  const currentTab = isRetail && activeTab === "credit" ? "cash" : activeTab;
  const currentPayment = detailsMap[currentTab];
  const isPaymentValid = Boolean(currentPayment?.isValid);
  const validationMessage = currentPayment?.errorMessage ?? (!isPaymentValid ? "Please complete payment details." : "");

  // Stable callback for child payment forms
  const handleTabDetailChange = useCallback((details: PaymentTabDetails) => {
    setDetailsMap((prev) => ({ ...prev, [details.type.toLowerCase()]: details }));
  }, []);

  const handleCompleteSale = async () => {
    if (!isPaymentValid || isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const payload = buildCheckoutPayload(currentTab, currentPayment, cartItems, cartTotal, customer);
      const res = await submitCheckout(payload);

      if (res.success && res.receipt) {
        onSuccess?.(res.receipt);
        handleClose();
      } else {
        setCheckoutError(res.message || "Failed to process checkout. Please try again.");
      }
    } catch (err: unknown) {
      setCheckoutError(getErrorMessage(err, "An unexpected error occurred during checkout."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading text-center">POS Checkout</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            Select payment method and finalize customer transaction
          </DialogDescription>
        </DialogHeader>

        {/* Total Summary Banner */}
        <PaymentTotalBanner cartTotal={cartTotal} customer={customer} />

        {/* Error Alert */}
        {checkoutError && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Payment Tabs */}
        <Tabs value={currentTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid w-full rounded-[4px] bg-muted p-1"
            style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}
          >
            {availableTabs.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="flex items-center gap-1.5 py-2 rounded-[2px] text-xs font-medium">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="cash">
            <CashPaymentForm amountDue={cartTotal} onPaymentChange={handleTabDetailChange} />
          </TabsContent>
          <TabsContent value="gcash">
            <GCashPaymentForm amountDue={cartTotal} onPaymentChange={handleTabDetailChange} />
          </TabsContent>
          {!isRetail && (
            <TabsContent value="credit">
              <CreditPaymentForm
                amountDue={cartTotal}
                initialCustomerId={customer?.type?.toUpperCase() === "WHOLESALE" ? customer.id : undefined}
                onPaymentChange={handleTabDetailChange}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Validation Notice */}
        {!isPaymentValid && validationMessage && (
          <p className="text-xs text-amber-600 text-right font-medium">{validationMessage}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2.5 mt-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="rounded-[4px] text-xs">
            Cancel
          </Button>
          <Button
            type="button"
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
  );
}