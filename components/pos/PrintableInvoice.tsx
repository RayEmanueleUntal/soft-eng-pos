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

/** Builds a display label for invoice_number with id fallback. */
function getInvoiceLabel(receipt: Receipt): string {
  return receipt.invoice_number ?? `#${receipt.id}`;
}

/** Formats cashier full name from staff relation. */
function getCashierName(receipt: Receipt): string {
  return `${receipt.staff.first_name} ${receipt.staff.last_name}`.trim();
}

/** Formats quantity without trailing zeros when whole. */
function formatQuantity(quantity: string): string {
  const num = parseFloat(quantity);
  if (!Number.isFinite(num)) {
    return quantity;
  }

  return Number.isInteger(num) ? String(num) : String(num);
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
  if (payment.payment_method === "CASH" && payment.cashPayment) {
    return (
      <>
        <ReceiptRow
          label="Cash tendered"
          value={formatPeso(payment.cashPayment.cash_tendered)}
        />
        <ReceiptRow
          label="Change"
          value={formatPeso(payment.cashPayment.change_given)}
        />
      </>
    );
  }

  if (payment.payment_method === "GCASH" && payment.gCashPayment) {
    return (
      <>
        <ReceiptRow
          label="GCash ref"
          value={payment.gCashPayment.reference_number}
        />
        <ReceiptRow
          label="Mobile"
          value={payment.gCashPayment.gcash_mobile_number}
        />
      </>
    );
  }

  if (payment.payment_method === "CREDIT" && payment.creditPayment) {
    return (
      <>
        <ReceiptRow
          label="Due date"
          value={formatReceiptDate(payment.creditPayment.due_date)}
        />
        <ReceiptRow
          label="Balance"
          value={formatPeso(payment.creditPayment.remaining_credit_balance)}
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
        <ReceiptRow label="Cashier" value={getCashierName(receipt)} />
        <ReceiptRow label="Customer" value={customerName} />
        <ReceiptRow label="Type" value={receipt.transaction_type} />
      </div>

      <ReceiptDivider />

      <div className="space-y-3">
        {receipt.transactionItems.map((item, index) => (
          <div key={`${item.product.name}-${index}`} className="space-y-0.5">
            <p className="font-medium wrap-break-word">{item.product.name}</p>
            {item.product.sku ? (
              <p className="text-[10px] text-gray-600">{item.product.sku}</p>
            ) : null}
            <ReceiptRow
              label={`${formatQuantity(item.quantity_sold)} ${item.unit_of_measure}`}
              value={formatPeso(item.subtotal)}
            />
            <ReceiptRow
              label={`@ ${formatPeso(item.unit_price)}`}
              value=""
            />
            {hasAmount(item.discount) ? (
              <ReceiptRow
                label="Discount"
                value={`-${formatPeso(item.discount)}`}
              />
            ) : null}
          </div>
        ))}
      </div>

      <ReceiptDivider />

      <div className="space-y-1">
        <ReceiptRow label="Subtotal" value={formatPeso(receipt.subtotal)} />
        {hasAmount(receipt.tax_total) ? (
          <ReceiptRow label="Tax" value={formatPeso(receipt.tax_total)} />
        ) : null}
        {hasAmount(receipt.discount_total) ? (
          <ReceiptRow
            label="Discount"
            value={`-${formatPeso(receipt.discount_total)}`}
          />
        ) : null}
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
