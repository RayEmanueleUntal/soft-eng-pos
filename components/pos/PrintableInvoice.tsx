// Thermal-printer-friendly receipt layout for POS transactions.
// Renders store details, line items, totals, and payment info from a Receipt prop.

import type {
  PaymentMethod,
  Receipt,
  ReceiptPayment,
} from "@/lib/pos/receipt-types";
import {
  formatPeso,
  formatReceiptDate,
  hasAmount,
} from "@/lib/pos/format-currency";
import { STORE_CONFIG } from "@/lib/pos/store-config";
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
  return <div className="border-t border-dashed border-gray-400 my-2" />;
}

export function PrintableInvoice({
  receipt,
  className,
  id = "printable-receipt",
}: PrintableInvoiceProps) {
  const customerName = receipt.customer?.name ?? "Walk-in Customer";

  return (
    <div
      id={id}
      className={cn(
        "w-full max-w-[80mm] bg-white text-black font-mono text-xs leading-relaxed p-4",
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
      </div>

      <ReceiptDivider />

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

      <ReceiptDivider />

      <p className="text-center text-[10px]">{STORE_CONFIG.thankYouMessage}</p>
    </div>
  );
}
