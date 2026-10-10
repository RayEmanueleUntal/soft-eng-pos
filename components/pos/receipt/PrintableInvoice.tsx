// Thermal-printer-friendly receipt layout for POS transactions.
// Renders store details, line items, totals, payment info, and refund/exchange history.

import {
  formatPeso,
  formatReceiptDate,
  STORE_CONFIG,
  type PaymentMethod,
  type Receipt,
  type ReceiptPayment,
  type ReceiptReturn,
  type ReceiptExchange,
  computeTotalRefunds,
  computeTotalExchangeDifference,
  computeAdjustedTotal,
  hasAdjustments,
  getReceiptDisplayStatus,
} from "@/lib/pos";
import { cn } from "@/lib/utils";

interface PrintableInvoiceProps {
  receipt: Receipt;
  className?: string;
  id?: string;
}

/** Builds a display label for invoice_number with transactionId fallback. */
function getInvoiceLabel(receipt: Receipt): string {
  return receipt.invoice_number ?? `#${receipt.transactionId}`;
}

/** Formats quantity without trailing zeros when whole. */
function formatQuantity(quantity: number): string {
  if (!Number.isFinite(quantity)) {
    return String(quantity);
  }

  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}

/** Maps backend payment method enum to readable label. */
function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "GCASH":
      return "GCash";
    case "CREDIT":
      return "Credit";
    default:
      return method;
  }
}

/** Formats an exchange price_difference for thermal print display. */
function formatPriceDifference(diff: number): string {
  if (diff === 0) return "Even swap";
  if (diff > 0) return `+${formatPeso(diff)}`;
  return formatPeso(diff);
}

/** Renders payment-specific details below the payment method row. */
function PaymentDetails({ payment }: { payment: ReceiptPayment }) {
  if (payment.payment_method === "CASH" && payment.cash_tendered !== undefined) {
    return (
      <>
        <ReceiptRow
          label="Cash tendered"
          value={formatPeso(payment.cash_tendered)}
        />
        <ReceiptRow
          label="Change"
          value={formatPeso(payment.change_given || 0)}
        />
      </>
    );
  }

  if (payment.payment_method === "GCASH" && payment.reference_number) {
    return (
      <>
        <ReceiptRow
          label="GCash ref"
          value={payment.reference_number}
        />
      </>
    );
  }

  return null;
}

/** Single label/value row used throughout the receipt layout. */
function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={cn("flex justify-between gap-2", bold && "font-semibold")}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

/** Renders a dashed divider between receipt sections. */
function ReceiptDivider() {
  return <div className="border-t border-dashed border-muted-foreground my-2" />;
}

/** Renders a double-line divider for totals emphasis. */
function ReceiptDoubleDivider() {
  return (
    <div className="my-2 space-y-0.5">
      <div className="border-t border-solid border-black" />
      <div className="border-t border-solid border-black" />
    </div>
  );
}

export function PrintableInvoice({
  receipt,
  className,
  id = "printable-receipt",
}: PrintableInvoiceProps) {
  const customerName = receipt.customer?.name ?? "Walk-in Customer";
  const displayStatus = getReceiptDisplayStatus(receipt);
  const showAdjustments = hasAdjustments(receipt);
  const totalRefunds = computeTotalRefunds(receipt);
  const totalExchangeDiff = computeTotalExchangeDifference(receipt);
  const adjustedTotal = computeAdjustedTotal(receipt);

  return (
    <div
      id={id}
      className={cn(
        "w-full max-w-[80mm] bg-card text-black font-mono text-xs leading-relaxed p-3",
        className
      )}
    >
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold uppercase">{STORE_CONFIG.name}</p>
        {STORE_CONFIG.address ? (
          <p className="text-[10px]">{STORE_CONFIG.address}</p>
        ) : null}
      </div>

      <ReceiptDivider />

      <div className="space-y-1">
        <ReceiptRow label="Invoice" value={getInvoiceLabel(receipt)} />
        <ReceiptRow label="Date" value={formatReceiptDate(receipt.date)} />
        <ReceiptRow label="Cashier" value={receipt.cashier_name} />
        <ReceiptRow label="Customer" value={customerName} />
        <ReceiptRow label="Type" value={receipt.transaction_type} />
        {displayStatus === "FULL_REFUND" && (
          <div className="text-center font-bold text-xs mt-1">
            *** FULLY REFUNDED ***
          </div>
        )}
        {displayStatus === "PARTIAL_RETURN" && (
          <div className="text-center font-bold text-xs mt-1">
            *** PARTIAL RETURN ***
          </div>
        )}
      </div>

      <ReceiptDivider />

      {/* Line Items */}
      <div className="space-y-3">
        {receipt.items.map((item, index) => (
          <div key={`${item.product_name}-${index}`} className="space-y-0.5">
            <p className="font-medium wrap-break-word">{item.product_name}</p>
            <ReceiptRow
              label={`${formatQuantity(item.quantity)}`}
              value={formatPeso(item.net_price)}
            />
            <ReceiptRow
              label={`@ ${formatPeso(item.applied_price)}`}
              value=""
            />
            {item.subtotal > item.net_price ? (
              <ReceiptRow
                label="Discount"
                value={`-${formatPeso(item.subtotal - item.net_price)}`}
              />
            ) : null}
            {(item.already_returned_qty ?? 0) > 0 && (
              <p className="text-[10px]">
                ({item.already_returned_qty} returned)
              </p>
            )}
          </div>
        ))}
      </div>

      <ReceiptDivider />

      <div className="space-y-1">
        <ReceiptRow
          label="TOTAL"
          value={formatPeso(receipt.grand_total)}
          bold
        />
      </div>

      <ReceiptDivider />

      {/* Payment Section */}
      <div className="space-y-2">
        {receipt.payments.map((payment, index) => (
          <div key={`payment-${index}`} className="space-y-1">
            <ReceiptRow
              label="Payment"
              value={formatPaymentMethod(payment.payment_method)}
            />
            <ReceiptRow
              label="Amount paid"
              value={formatPeso(payment.amount_paid)}
            />
            <PaymentDetails payment={payment} />
          </div>
        ))}
      </div>

      {/* Returns Section */}
      {receipt.returns && receipt.returns.length > 0 && (
        <>
          <ReceiptDivider />
          <div className="space-y-2">
            <p className="font-semibold text-center">RETURNS</p>
            {receipt.returns.map((ret: ReceiptReturn) => (
              <div key={ret.id} className="space-y-0.5">
                <p className="font-medium wrap-break-word">{ret.product_name}</p>
                <ReceiptRow
                  label={`Qty: ${ret.quantity}`}
                  value={`Refund: ${formatPeso(ret.refund_amount)}`}
                />
                <p className="text-[10px]">Reason: {ret.defect_reason}</p>
                <p className="text-[10px]">Staff: {ret.processed_by_staff}</p>
                <p className="text-[10px]">Date: {formatReceiptDate(ret.date)}</p>
              </div>
            ))}
            <ReceiptDivider />
            <ReceiptRow
              label="Total Refunds"
              value={formatPeso(totalRefunds)}
              bold
            />
          </div>
        </>
      )}

      {/* Exchanges Section */}
      {receipt.exchanges && receipt.exchanges.length > 0 && (
        <>
          <ReceiptDivider />
          <div className="space-y-2">
            <p className="font-semibold text-center">EXCHANGES</p>
            {receipt.exchanges.map((exc: ReceiptExchange) => (
              <div key={exc.id} className="space-y-0.5">
                <p className="font-medium wrap-break-word">{exc.product_name}</p>
                <ReceiptRow
                  label={`Qty: ${exc.quantity}`}
                  value={`Diff: ${formatPriceDifference(exc.price_difference)}`}
                />
                <p className="text-[10px]">Date: {formatReceiptDate(exc.date)}</p>
                {exc.is_within_7_days && (
                  <p className="text-[10px]">[Within 7-day window]</p>
                )}
              </div>
            ))}
            {totalExchangeDiff !== 0 && (
              <>
                <ReceiptDivider />
                <ReceiptRow
                  label="Total Exchange Diff"
                  value={formatPriceDifference(totalExchangeDiff)}
                  bold
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Adjusted Net Total */}
      {showAdjustments && (
        <>
          <ReceiptDoubleDivider />
          <div className="space-y-1">
            {displayStatus === "FULL_REFUND" ? (
              <ReceiptRow
                label="FULLY REFUNDED"
                value={formatPeso(0)}
                bold
              />
            ) : (
              <ReceiptRow
                label="ADJUSTED NET TOTAL"
                value={formatPeso(adjustedTotal)}
                bold
              />
            )}
          </div>
          <ReceiptDoubleDivider />
        </>
      )}

      {!showAdjustments && <ReceiptDivider />}

      <p className="text-center text-[10px]">{STORE_CONFIG.thankYouMessage}</p>
    </div>
  );
}
