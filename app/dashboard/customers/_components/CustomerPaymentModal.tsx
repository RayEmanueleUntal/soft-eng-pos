"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  collectCustomerPayment,
  getCustomerOverdueStatus,
} from "@/lib/customers/customer-api";
import type {
  Customer,
  CustomerOverdueStatus,
  CustomerPayment,
  SettlementPaymentMethod,
} from "@/lib/customers/types";
import { formatPeso, getErrorMessage } from "@/lib/utils";

interface CustomerPaymentModalProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: (payment: CustomerPayment, customer: Customer) => void;
}

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

export function CustomerPaymentModal({
  customer,
  open,
  onOpenChange,
  onPaymentSuccess,
}: CustomerPaymentModalProps) {
  const wholesale = customer.wholesale;
  const outstandingBalance = wholesale?.outstanding_balance ?? 0;
  const creditLimit = wholesale?.credit_limit ?? 0;
  const availableCredit = Math.max(0, creditLimit - outstandingBalance);

  const [overdueStatus, setOverdueStatus] =
    useState<CustomerOverdueStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<SettlementPaymentMethod>("CASH");
  const [amountTendered, setAmountTendered] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!open || !customer.wholesale) {
      setOverdueStatus(null);
      setStatusError("");
      setIsLoadingStatus(false);
      return;
    }

    setIsLoadingStatus(true);
    setStatusError("");

    try {
      const status = await getCustomerOverdueStatus(customer.id);
      setOverdueStatus(status);
    } catch (err) {
      setStatusError(
        getErrorMessage(err, "Failed to load overdue status."),
      );
    } finally {
      setIsLoadingStatus(false);
    }
  }, [open, customer.id, customer.wholesale]);

  useEffect(() => {
    if (!open) return;

    setPaymentMethod("CASH");
    setAmountTendered(
      outstandingBalance > 0 ? outstandingBalance.toFixed(2) : "",
    );
    setReferenceNumber("");
    setNotes("");
    setSubmitError("");
    setOverdueStatus(null);

    void fetchStatus();
  }, [open, customer.id, outstandingBalance, fetchStatus]);

  const tenderedAmount =
    amountTendered.trim() === "" ? NaN : Number(amountTendered);
  const hasTendered = Number.isFinite(tenderedAmount) && tenderedAmount > 0;

  const tenderedCents = hasTendered ? toCents(tenderedAmount) : 0;
  const balanceCents = toCents(outstandingBalance);
  const acceptedCents = hasTendered
    ? Math.min(tenderedCents, balanceCents)
    : 0;
  const changeCents = hasTendered
    ? Math.max(0, tenderedCents - balanceCents)
    : 0;
  const newBalanceCents = Math.max(0, balanceCents - acceptedCents);

  const acceptedAmount = fromCents(acceptedCents);
  const changeAmount = fromCents(changeCents);
  const newBalanceAmount = fromCents(newBalanceCents);
  const isGcash = paymentMethod === "GCASH";
  const isReferenceValid = !isGcash || referenceNumber.trim().length > 0;

  const canSubmit = Boolean(
    wholesale &&
      outstandingBalance > 0 &&
      hasTendered &&
      acceptedCents > 0 &&
      isReferenceValid &&
      !isLoadingStatus &&
      !isSubmitting,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payment = await collectCustomerPayment(customer.id, {
        amount_paid: acceptedAmount,
        payment_method: paymentMethod,
        ...(isGcash ? { reference_number: referenceNumber.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      onPaymentSuccess(payment, customer);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to record payment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[4px] border border-input shadow-[0px_4px_0px_rgba(15,23,42,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Settle Credit Balance
          </DialogTitle>
          <DialogDescription className="break-words">
            {wholesale?.company_name || customer.name} — {customer.name}
          </DialogDescription>
        </DialogHeader>

        {!wholesale ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Wholesale profile not found for this customer.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[4px] border border-border bg-muted/40 p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Outstanding Balance</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {formatPeso(outstandingBalance)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Credit Limit</span>
                <span className="font-mono text-foreground tabular-nums">
                  {formatPeso(creditLimit)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Available Credit</span>
                <span className="font-mono text-foreground tabular-nums">
                  {formatPeso(availableCredit)}
                </span>
              </div>

              <div className="mt-3 border-t border-border pt-2">
                {isLoadingStatus ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking overdue status...
                  </div>
                ) : statusError ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-destructive">{statusError}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => void fetchStatus()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : overdueStatus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        overdueStatus.hasOverdue ? "destructive" : "secondary"
                      }
                    >
                      {overdueStatus.hasOverdue ? "Overdue" : "No overdue"}
                    </Badge>
                    <span className="font-mono text-muted-foreground tabular-nums">
                      {overdueStatus.hasOverdue
                        ? `${overdueStatus.overdueCount} invoice${
                            overdueStatus.overdueCount === 1 ? "" : "s"
                          } • ${formatPeso(
                            overdueStatus.totalOverdueAmount,
                          )} past due`
                        : "No overdue credit payments."}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="settlement-method">Payment Method</Label>
                <select
                  id="settlement-method"
                  className="flex h-9 w-full rounded-[4px] border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value as SettlementPaymentMethod,
                    )
                  }
                  disabled={isSubmitting}
                >
                  <option value="CASH">Cash</option>
                  <option value="GCASH">GCash</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="settlement-amount">
                  Amount Tendered / Received (₱)
                </Label>
                <Input
                  id="settlement-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amountTendered}
                  onChange={(event) => setAmountTendered(event.target.value)}
                  disabled={isSubmitting || outstandingBalance <= 0}
                  className="h-9 rounded-[4px] border-input font-mono text-sm"
                />
              </div>
            </div>

            {isGcash && (
              <div className="grid gap-1.5">
                <Label htmlFor="settlement-reference">
                  GCash Reference Number *
                </Label>
                <Input
                  id="settlement-reference"
                  placeholder="e.g. 100029384758"
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  disabled={isSubmitting}
                  className="h-9 rounded-[4px] border-input font-mono text-sm"
                />
                {!isReferenceValid && (
                  <p className="text-xs text-muted-foreground">
                    Required for GCash settlement audit trail.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="settlement-notes">Notes (optional)</Label>
              <Textarea
                id="settlement-notes"
                placeholder="Optional settlement note..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSubmitting}
                className="min-h-[70px] rounded-[4px] text-sm"
              />
            </div>

            <div className="rounded-[4px] border border-border bg-background p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Accepted Amount</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {hasTendered ? formatPeso(acceptedAmount) : "—"}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Change Due</span>
                <span className="font-mono text-foreground tabular-nums">
                  {hasTendered ? formatPeso(changeAmount) : "—"}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  New Balance After Payment
                </span>
                <span className="font-mono font-semibold text-primary tabular-nums">
                  {hasTendered ? formatPeso(newBalanceAmount) : "—"}
                </span>
              </div>

              {changeAmount > 0 && (
                <p className="mt-2 text-amber-600">
                  Customer tendered more than the balance. Only{" "}
                  {formatPeso(acceptedAmount)} will be applied;{" "}
                  {formatPeso(changeAmount)} is change/refund due.
                </p>
              )}
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-[4px] border border-destructive/30 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
