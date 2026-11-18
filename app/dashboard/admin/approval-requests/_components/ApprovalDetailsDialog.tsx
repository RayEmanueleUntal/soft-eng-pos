// Compact approval request details popup (about 500px, same size as the staff popup).
// Shows the decision data first (refund totals, items) and tucks the raw payload into a collapsible.
// Closes via the dialog X, Esc or overlay only; the footer holds Approve/Reject for pending requests.
"use client";

import React from "react";
import { AlertCircle, ChevronDown, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatReceiptDate, hasAmount } from "@/lib/pos";
import { formatPeso } from "@/lib/utils";
import type { ApprovalRequestResponseDto } from "@/lib/approval/approval-api";
import { PayloadRenderer } from "./PayloadRenderer";

interface ApprovalDetailsDialogProps {
  request: ApprovalRequestResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterName: string;
  reviewerName: string | null;
  statusBadge: React.ReactNode;
  onApprove: () => void;
  onReject: () => void;
}

type PayloadRecord = Record<string, unknown>;

const LABEL_CLASS =
  "block font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const TOTAL_KEYS = [
  "totalRefundAmount",
  "totalRefund",
  "total_refund_amount",
  "total_refund",
];
const CREDIT_KEYS = [
  "creditDebtReduction",
  "creditDebtCancellation",
  "credit_debt_reduction",
  "credit_debt_cancellation",
];
const CASH_KEYS = [
  "cashPayoutAmount",
  "cashPayout",
  "cash_payout_amount",
  "cash_payout",
];

/** Parses string or object approval payloads into a plain object. */
function parsePayload(raw: unknown): PayloadRecord {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as PayloadRecord)
        : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? (raw as PayloadRecord) : {};
}

/** Turns SNAKE_CASE / camelCase codes into readable Title Case words. */
function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Maps backend request types onto short titles for the dialog header. */
function getRequestTitle(type: string): string {
  if (type === "REFUND_TRANSACTION") return "Refund Request";
  if (type === "EXCHANGE_TRANSACTION") return "Exchange Request";
  return humanize(type);
}

/** Invoice label from a return/exchange payload, or null when unknown. */
function getInvoiceLabel(payload: PayloadRecord): string | null {
  const invoiceNumber = payload.invoice_number ?? payload.invoiceNumber;
  if (invoiceNumber) return String(invoiceNumber);
  const transactionId = payload.transactionId ?? payload.transaction_id;
  return transactionId != null && transactionId !== ""
    ? `INV-${transactionId}`
    : null;
}

/** First finite number found under any of the given keys, else null. */
function pickNumber(source: PayloadRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
  }
  return null;
}

/** Plain-object rows from payload.items (empty when absent). */
function getItems(payload: PayloadRecord): PayloadRecord[] {
  return Array.isArray(payload.items)
    ? payload.items.filter(
        (item): item is PayloadRecord => !!item && typeof item === "object",
      )
    : [];
}

/** Label/value cell used by the summary grid. */
function SummaryCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className={LABEL_CLASS}>{label}</span>
      <span className="block break-words font-sans text-xs text-foreground">
        {children}
      </span>
    </div>
  );
}

/** Label/amount row used inside the refund summary box. */
function AmountRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5">
      <span
        className={`text-xs ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${strong ? "text-sm font-bold text-foreground" : "text-xs text-foreground"}`}
      >
        {formatPeso(value)}
      </span>
    </div>
  );
}

/** Details popup for one approval request with the single decision footer. */
export function ApprovalDetailsDialog({
  request,
  open,
  onOpenChange,
  requesterName,
  reviewerName,
  statusBadge,
  onApprove,
  onReject,
}: ApprovalDetailsDialogProps) {
  if (!request) return null;

  const payload = parsePayload(request.payload);
  const invoiceLabel = getInvoiceLabel(payload);
  const items = getItems(payload);
  const isPending = request.status === "PENDING";
  const stockOverride = payload.allowStockOverride === true;

  const breakdownRaw = payload.paymentBreakdown ?? payload.payment_breakdown;
  const breakdown =
    breakdownRaw && typeof breakdownRaw === "object"
      ? (breakdownRaw as PayloadRecord)
      : null;
  const totalRefund = breakdown ? pickNumber(breakdown, TOTAL_KEYS) : null;
  const creditReduction = breakdown ? pickNumber(breakdown, CREDIT_KEYS) : null;
  const cashPayout = breakdown ? pickNumber(breakdown, CASH_KEYS) : null;
  const hasBreakdown =
    totalRefund !== null || creditReduction !== null || cashPayout !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-[4px] border border-input bg-card shadow-[0px_4px_0px_rgba(15,23,42,0.08)] sm:max-w-[500px]">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground">
            <span>{getRequestTitle(request.type)}</span>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              #{request.id}
            </span>
            {statusBadge}
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground">
            {invoiceLabel ? (
              <>
                Invoice{" "}
                <span className="font-mono font-medium text-foreground">
                  {invoiceLabel}
                </span>
              </>
            ) : (
              "Review the request details before deciding."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[4px] border border-border bg-muted/40 p-3">
            <SummaryCell label="Requested by">{requesterName}</SummaryCell>
            <SummaryCell label="Requested on">
              <span className="font-mono">
                {formatReceiptDate(request.createdAt)}
              </span>
            </SummaryCell>
            {!isPending && (
              <>
                <SummaryCell label="Reviewed by">
                  {reviewerName ?? "-"}
                </SummaryCell>
                <SummaryCell label="Reviewed on">
                  <span className="font-mono">
                    {formatReceiptDate(request.updatedAt)}
                  </span>
                </SummaryCell>
              </>
            )}
          </div>

          {request.rejectionReason && (
            <div className="space-y-1 rounded-[4px] border border-rose-500/30 bg-rose-500/10 p-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Rejection
                reason
              </span>
              <p className="whitespace-pre-wrap break-words text-rose-900 dark:text-rose-200">
                {request.rejectionReason}
              </p>
            </div>
          )}

          {stockOverride && (
            <div className="flex items-start gap-2 rounded-[4px] border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Stock override: this exchange may take stock below zero.
              </span>
            </div>
          )}

          {hasBreakdown && (
            <div className="divide-y divide-border rounded-[4px] border border-border">
              <div className="bg-muted/40 px-3 py-1.5">
                <span className={LABEL_CLASS}>Refund summary</span>
              </div>
              {totalRefund !== null && (
                <AmountRow label="Total refund" value={totalRefund} strong />
              )}
              {creditReduction !== null && hasAmount(creditReduction) && (
                <AmountRow
                  label="Credit debt reduction"
                  value={creditReduction}
                />
              )}
              {cashPayout !== null && (
                <AmountRow label="Cash payout" value={cashPayout} />
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="divide-y divide-border rounded-[4px] border border-border">
              <div className="bg-muted/40 px-3 py-1.5">
                <span className={LABEL_CLASS}>Items ({items.length})</span>
              </div>
              {items.map((item, idx) => {
                const refundAmount = pickNumber(item, ["itemRefundAmount"]);
                const quantity = item.requestedQuantity ?? item.quantity;
                const uom = item.unitOfMeasure ?? item.unit_of_measure;
                const meta = [
                  item.condition ? humanize(String(item.condition)) : null,
                  item.reason ? String(item.reason) : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div key={idx} className="space-y-0.5 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words font-sans text-xs font-medium text-foreground">
                        {String(
                          item.productName ?? `Product #${item.productId ?? "?"}`,
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
                        {quantity != null ? String(quantity) : "-"}
                        {uom ? ` ${String(uom)}` : ""}
                        {refundAmount !== null
                          ? ` · ${formatPeso(refundAmount)}`
                          : ""}
                      </span>
                    </div>
                    {meta && (
                      <p className="break-words text-[11px] text-muted-foreground">
                        {meta}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <details className="group rounded-[4px] border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              All details
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-3">
              <PayloadRenderer data={request.payload} />
            </div>
          </details>
        </div>

        {isPending && (
          <DialogFooter className="mt-0 shrink-0 gap-2 border-t border-border bg-card pt-3">
            <Button
              type="button"
              variant="destructive"
              onClick={onReject}
              className="rounded-[4px] text-xs"
            >
              Reject
            </Button>
            <Button
              type="button"
              onClick={onApprove}
              className="rounded-[4px] bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
