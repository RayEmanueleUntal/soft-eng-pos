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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import CashPaymentForm from "./CashPaymentForm";
import GCashPaymentForm from "./GCashPaymentForm";
import CreditPaymentForm from "./CreditPaymentForm";
import { PaymentTotalBanner } from "./PaymentTotalBanner";
import {
  submitCheckout,
  buildCheckoutPayload,
  formatPeso,
  type PaymentTabDetails,
  type PaymentModalItem,
  type PaymentModalCustomer,
  type Receipt,
  type CheckoutPaymentEntry,
  type PaymentMethod,
} from "@/lib/pos";
import { getErrorMessage } from "@/lib/utils";

// Re-export types so existing imports across components remain intact
export type { PaymentTabDetails, PaymentModalItem, PaymentModalCustomer };

export interface AppliedPaymentItem {
  id: string;
  method: PaymentMethod;
  amount: number;
  description: string;
  entry: CheckoutPaymentEntry;
}

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
  const isWholesale = customer?.type?.toUpperCase() === "WHOLESALE";
  const baseTabs = PAYMENT_TABS.filter((tab) => !tab.wholesaleOnly || isWholesale);

  const [activeTab, setActiveTab] = useState<string>("cash");
  const [detailsMap, setDetailsMap] = useState<Record<string, PaymentTabDetails>>({});
  const [appliedPayments, setAppliedPayments] = useState<AppliedPaymentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Filter out payment methods that have already been applied to prevent duplicate tender entries
  const appliedMethods = new Set(appliedPayments.map((p) => p.method.toLowerCase()));
  const availableTabs = baseTabs.filter((tab) => !appliedMethods.has(tab.id.toLowerCase()));

  // Split-payment financial totals
  const totalPaid = Number(
    appliedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
  );
  const remainingDue = Math.max(0, Number((cartTotal - totalPaid).toFixed(2)));
  const isFullyPaid = remainingDue <= 0.01;

  // Event-driven reset to prevent leaking previous transaction data without triggering cascading renders
  const handleClose = () => {
    if (isSubmitting) return;
    setActiveTab("cash");
    setDetailsMap({});
    setAppliedPayments([]);
    setCheckoutError(null);
    setIsSubmitting(false);
    onClose();
  };

  // Keep active tab valid within currently available (unapplied) tabs
  const currentTab = availableTabs.some((t) => t.id === activeTab)
    ? activeTab
    : availableTabs[0]?.id || "cash";
  const currentPayment = detailsMap[currentTab];
  const isPaymentValid = Boolean(currentPayment?.isValid);
  const currentAmount = typeof currentPayment?.amount === "number" ? currentPayment.amount : 0;

  // Helper to convert active tab details into standardized CheckoutPaymentEntry
  const getCurrentPaymentEntry = (): { entry: CheckoutPaymentEntry; description: string } | null => {
    if (!currentPayment || !isPaymentValid || currentAmount <= 0) return null;

    if (currentPayment.type === "CASH") {
      return {
        entry: {
          payment_method: "CASH",
          amount_paid: currentAmount,
          cash_tendered: currentPayment.cashTendered ?? currentAmount,
          change_given: currentPayment.changeDue ?? 0,
        },
        description: `Tendered: ${formatPeso(currentPayment.cashTendered ?? currentAmount)}${
          (currentPayment.changeDue ?? 0) > 0 ? ` (Change: ${formatPeso(currentPayment.changeDue ?? 0)})` : ""
        }`,
      };
    }

    if (currentPayment.type === "GCASH") {
      return {
        entry: {
          payment_method: "GCASH",
          amount_paid: currentAmount,
          reference_number: currentPayment.referenceNumber,
          mobile_number: currentPayment.mobileNumber,
          gcash_mobile_number: currentPayment.mobileNumber,
        },
        description: `Ref: ${currentPayment.referenceNumber} (${currentPayment.mobileNumber})`,
      };
    }

    if (currentPayment.type === "CREDIT") {
      return {
        entry: {
          payment_method: "CREDIT",
          amount_paid: currentAmount,
          credit_due_date: currentPayment.dueDate,
          po_number: currentPayment.poNumber,
        },
        description: `Due: ${currentPayment.dueDate || "N/A"}${
          currentPayment.poNumber ? ` (PO: ${currentPayment.poNumber})` : ""
        }`,
      };
    }

    return null;
  };

  // Add current active tab payment to the applied split payments list and auto-hide that tab
  const handleAddCurrentTender = () => {
    const result = getCurrentPaymentEntry();
    if (!result) return;

    const newPayment: AppliedPaymentItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      method: result.entry.payment_method,
      amount: result.entry.amount_paid,
      description: result.description,
      entry: result.entry,
    };

    const nextApplied = [...appliedPayments, newPayment];
    setAppliedPayments(nextApplied);

    // Auto-switch to next remaining available tab
    const nextUsedMethods = new Set(nextApplied.map((p) => p.method.toLowerCase()));
    const remainingTabs = baseTabs.filter((tab) => !nextUsedMethods.has(tab.id.toLowerCase()));
    if (remainingTabs.length > 0) {
      setActiveTab(remainingTabs[0].id);
    }
  };

  // Remove a tender from the applied split payments list and restore its tab
  const handleRemoveTender = (id: string) => {
    const removedItem = appliedPayments.find((p) => p.id === id);
    setAppliedPayments((prev) => prev.filter((p) => p.id !== id));
    if (removedItem) {
      setActiveTab(removedItem.method.toLowerCase());
    }
  };

  // Determine if sale can be completed right away
  const canCompleteWithCurrentTab = isPaymentValid && currentAmount >= (remainingDue - 0.01);
  const canCompleteSale = isFullyPaid || canCompleteWithCurrentTab;

  const validationMessage =
    currentPayment?.errorMessage ??
    (!canCompleteSale
      ? `Remaining balance of ${formatPeso(remainingDue)} must be covered.`
      : "");

  // Stable callback for child payment forms
  const handleTabDetailChange = useCallback((details: PaymentTabDetails) => {
    setDetailsMap((prev) => ({ ...prev, [details.type.toLowerCase()]: details }));
  }, []);

  const handleCompleteSale = async () => {
    if (!canCompleteSale || isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      let finalPayments: CheckoutPaymentEntry[] = [];

      if (isFullyPaid) {
        finalPayments = appliedPayments.map((p) => p.entry);
      } else if (appliedPayments.length === 0) {
        // Single tender checkout directly from form
        const currentResult = getCurrentPaymentEntry();
        if (!currentResult) {
          throw new Error("Please complete the required payment details.");
        }
        finalPayments = [currentResult.entry];
      } else {
        // Split checkout: combine existing tenders with current form tender
        const currentResult = getCurrentPaymentEntry();
        if (!currentResult) {
          throw new Error("Please complete the payment details for the remaining balance.");
        }
        finalPayments = [...appliedPayments.map((p) => p.entry), currentResult.entry];
      }

      const payload = buildCheckoutPayload(
        finalPayments[0].payment_method.toLowerCase(),
        undefined,
        cartItems,
        cartTotal,
        customer,
        finalPayments
      );

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
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading text-center">POS Checkout</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground font-sans">
            Process full or split payment for customer transaction
          </DialogDescription>
        </DialogHeader>

        {/* Total Summary Banner with Live Split Balance */}
        <PaymentTotalBanner
          cartTotal={cartTotal}
          customer={customer}
          paidAmount={totalPaid}
          remainingDue={remainingDue}
        />

        {/* Error Alert */}
        {checkoutError && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 p-2.5 rounded-[4px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Applied Split Payments Tray */}
        {appliedPayments.length > 0 && (
          <div className="space-y-2 rounded-[4px] border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Applied Payments ({appliedPayments.length})
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                Allocated: <strong className="text-foreground">{formatPeso(totalPaid)}</strong>
              </span>
            </div>
            <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
              {appliedPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-[3px] border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Badge variant="outline" className="rounded-[2px] px-1.5 py-0 text-[10px] font-mono font-bold">
                      {p.method}
                    </Badge>
                    <div className="truncate">
                      <span className="font-mono font-bold text-foreground">{formatPeso(p.amount)}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground truncate">{p.description}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTender(p.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title="Remove payment"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Forms or Fully Paid Banner */}
        {isFullyPaid ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-emerald-500/40 bg-emerald-500/10 rounded-[4px] space-y-2 my-1">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div className="font-semibold text-sm text-foreground">Transaction Fully Covered</div>
            <p className="text-xs text-muted-foreground">
              Total of <span className="font-mono font-bold text-foreground">{formatPeso(totalPaid)}</span> has been allocated across {appliedPayments.length} payment method{appliedPayments.length > 1 ? "s" : ""}. Click &quot;Complete Sale&quot; to finalize.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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

              {availableTabs.some((t) => t.id === "cash") && (
                <TabsContent value="cash">
                  <CashPaymentForm amountDue={remainingDue} onPaymentChange={handleTabDetailChange} />
                </TabsContent>
              )}
              {availableTabs.some((t) => t.id === "gcash") && (
                <TabsContent value="gcash">
                  <GCashPaymentForm amountDue={remainingDue} onPaymentChange={handleTabDetailChange} />
                </TabsContent>
              )}
              {isWholesale && availableTabs.some((t) => t.id === "credit") && (
                <TabsContent value="credit">
                  <CreditPaymentForm
                    amountDue={remainingDue}
                    initialCustomerId={customer?.id}
                    onPaymentChange={handleTabDetailChange}
                  />
                </TabsContent>
              )}
            </Tabs>

            {/* Add to Split Button */}
            {remainingDue > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCurrentTender}
                disabled={!isPaymentValid || isSubmitting || currentAmount <= 0}
                className="w-full rounded-[4px] text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 py-2"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Add {currentAmount > 0 ? formatPeso(currentAmount) : ""} {currentTab.toUpperCase()} to Split
                </span>
              </Button>
            )}
          </div>
        )}

        {/* Validation Notice */}
        {!canCompleteSale && validationMessage && (
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
            disabled={!canCompleteSale || isSubmitting}
            className="bg-primary hover:bg-primary/80 text-white min-w-[150px] rounded-[4px] text-xs uppercase font-bold tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Complete Sale (${formatPeso(cartTotal)})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
