// Maps GET /transactions/receipt/:id payloads onto the POS Receipt type.
// Coerces Prisma Decimal/string amounts so print and detail views do not show ₱0.00.
// Lookups accept snake_case and camelCase aliases from the live Swagger DTO.

import type {
  PaymentMethod,
  Receipt,
  ReceiptExchange,
  ReceiptItem,
  ReceiptPayment,
  ReceiptReturn,
  ReceiptShipment,
  TransactionStatus,
  TransactionType,
} from "../types/pos-types";

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function pick(raw: Json, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

/** Parses money/qty from number, numeric string, or Prisma Decimal-like objects. */
export function toMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  const obj = asRecord(value);
  if (obj) {
    const withToNumber = obj as { toNumber?: () => number };
    if (typeof withToNumber.toNumber === "function") {
      const parsed = withToNumber.toNumber();
      if (Number.isFinite(parsed)) return parsed;
    }
    if (typeof obj.valueOf === "function" && obj.valueOf !== Object.prototype.valueOf) {
      const parsed = Number(obj.valueOf());
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function toText(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const nested = asRecord(value);
    if (nested) {
      const fromNested = toText(
        nested.full_name,
        nested.fullName,
        nested.name,
        [nested.first_name, nested.last_name].filter(Boolean).join(" "),
      );
      if (fromNested) return fromNested;
      continue;
    }
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapItem(rawValue: unknown): ReceiptItem {
  const raw = asRecord(rawValue) ?? {};
  const product = asRecord(pick(raw, "product"));
  const quantity = toMoney(pick(raw, "quantity", "qty")) || 1;
  const applied = toMoney(
    pick(raw, "applied_price", "appliedPrice", "unit_price", "unitPrice"),
  );
  const subtotal = toMoney(
    pick(raw, "subtotal", "line_total", "lineTotal", "net_price", "netPrice"),
  );
  const net =
    toMoney(pick(raw, "net_price", "netPrice")) ||
    subtotal ||
    applied * quantity;
  const uom = toText(
    pick(raw, "pricing_uom", "pricingUom", "unit_of_measure", "uom"),
    product?.pricing_uom,
  );
  const baseUom = toText(
    pick(raw, "base_uom", "baseUom"),
    product?.base_uom,
    product?.baseUom,
  );

  return {
    productId: toMoney(pick(raw, "productId", "product_id", "id")) || undefined,
    product_name:
      toText(pick(raw, "product_name", "productName"), product?.name) ||
      "Item",
    quantity,
    applied_price: applied,
    subtotal: subtotal || applied * quantity,
    discounted_price: toMoney(
      pick(raw, "discounted_price", "discountedPrice"),
    ),
    net_price: net,
    pricing_uom: uom || undefined,
    unit_of_measure: uom || undefined,
    base_uom: baseUom || undefined,
    already_returned_qty: toMoney(
      pick(raw, "already_returned_qty", "alreadyReturnedQty"),
    ),
  };
}

function mapReturn(rawValue: unknown, items: ReceiptItem[]): ReceiptReturn {
  const raw = asRecord(rawValue) ?? {};
  const product = asRecord(pick(raw, "product"));
  const staff = pick(raw, "processed_by_staff", "processedBy", "staff", "processed_by");
  const productId = toMoney(pick(raw, "productId", "product_id"));
  const matched = items.find((item) => item.productId === productId);
  const quantity = toMoney(pick(raw, "quantity", "qty")) || 1;
  const unit = toMoney(
    pick(raw, "unit_price", "unitPrice", "applied_price") ??
      matched?.applied_price,
  );
  const refund = toMoney(
    pick(raw, "refund_amount", "refundAmount", "amount", "total_refund"),
  );

  return {
    id: toMoney(pick(raw, "id")) || 0,
    productId,
    product_name:
      toText(pick(raw, "product_name", "productName"), product?.name) ||
      matched?.product_name ||
      "Returned Item",
    quantity,
    date: toText(pick(raw, "date", "createdAt", "created_at", "updatedAt")) ||
      new Date().toISOString(),
    defect_reason:
      toText(
        pick(raw, "defect_reason", "defectReason", "reason", "item_condition"),
      ) || "Return",
    refund_amount: refund || unit * quantity,
    processed_by_staff: toText(staff) || "Staff",
    pricing_uom:
      toText(pick(raw, "pricing_uom", "unit_of_measure", "uom")) ||
      matched?.pricing_uom ||
      matched?.unit_of_measure,
  };
}

function mapExchange(rawValue: unknown, items: ReceiptItem[]): ReceiptExchange {
  const raw = asRecord(rawValue) ?? {};
  const product = asRecord(pick(raw, "product"));
  const productId = toMoney(pick(raw, "productId", "product_id"));
  const matched = items.find((item) => item.productId === productId);

  return {
    id: toMoney(pick(raw, "id")) || 0,
    productId,
    product_name:
      toText(pick(raw, "product_name", "productName"), product?.name) ||
      matched?.product_name ||
      "Exchanged Item",
    quantity: toMoney(pick(raw, "quantity", "qty")) || 1,
    date: toText(pick(raw, "date", "createdAt", "created_at")) ||
      new Date().toISOString(),
    price_difference: toMoney(
      pick(raw, "price_difference", "priceDifference", "difference"),
    ),
    is_within_7_days: Boolean(
      pick(raw, "is_within_7_days", "isWithin7Days") ?? true,
    ),
  };
}

function mapPayment(rawValue: unknown): ReceiptPayment {
  const raw = asRecord(rawValue) ?? {};
  const cash = asRecord(pick(raw, "cashPayment", "cash_payment"));
  const gcash = asRecord(pick(raw, "gCashPayment", "gcash_payment"));

  return {
    payment_method: (toText(
      pick(raw, "payment_method", "paymentMethod"),
    ) || "CASH") as PaymentMethod,
    amount_paid: toMoney(pick(raw, "amount_paid", "amountPaid", "amount")),
    cash_tendered: toMoney(
      pick(raw, "cash_tendered", "cashTendered") ?? cash?.cash_tendered,
    ),
    change_given: toMoney(
      pick(raw, "change_given", "changeGiven") ?? cash?.change_given,
    ),
    reference_number:
      toText(
        pick(raw, "reference_number", "referenceNumber") ??
          gcash?.reference_number,
      ) || undefined,
    gcash_mobile_number:
      toText(
        pick(raw, "gcash_mobile_number", "gcashMobileNumber") ??
          gcash?.gcash_mobile_number,
      ) || undefined,
    due_date: toText(pick(raw, "due_date", "dueDate")) || undefined,
    remaining_credit_balance: toMoney(
      pick(raw, "remaining_credit_balance", "remainingCreditBalance"),
    ),
  };
}

function mapShipment(rawValue: unknown): ReceiptShipment {
  const raw = asRecord(rawValue) ?? {};
  const forwarder = asRecord(pick(raw, "forwarder"));
  return {
    id: toMoney(pick(raw, "id")) || 0,
    forwarder_name:
      toText(
        pick(raw, "forwarder_name", "forwarderName"),
        forwarder?.company_name,
        forwarder?.name,
      ) || "Forwarder",
    dispatch_date:
      toText(pick(raw, "dispatch_date", "dispatchDate", "createdAt")) ||
      new Date().toISOString(),
    tracking_status:
      toText(pick(raw, "tracking_status", "trackingStatus", "status")) ||
      "PENDING",
  };
}

/** Maps a raw GET receipt payload (or `{ data: ... }` wrap) onto Receipt. */
export function mapReceiptPayload(payload: unknown): Receipt {
  const root = asRecord(payload) ?? {};
  const raw = asRecord(root.data) ?? root;
  const customerRaw = asRecord(pick(raw, "customer"));
  const items = asList(pick(raw, "items", "line_items")).map(mapItem);

  return {
    transactionId: toMoney(
      pick(raw, "transactionId", "transaction_id", "id"),
    ),
    invoice_number:
      toText(pick(raw, "invoice_number", "invoiceNumber")) || null,
    date: (pick(raw, "date", "createdAt") as string | Date) || new Date().toISOString(),
    grand_total: toMoney(pick(raw, "grand_total", "grandTotal", "total")),
    discount_total: toMoney(pick(raw, "discount_total", "discountTotal")),
    order_discount: toMoney(pick(raw, "order_discount", "orderDiscount")),
    transaction_type: (toText(
      pick(raw, "transaction_type", "transactionType"),
    ) || "RETAIL") as TransactionType,
    status: toText(pick(raw, "status")) as TransactionStatus | undefined,
    cashier_name: toText(pick(raw, "cashier_name", "cashierName")) || "Cashier",
    customer: customerRaw
      ? {
          name: toText(pick(customerRaw, "name")) || "-",
          number: toText(pick(customerRaw, "number", "phone")) || "",
        }
      : null,
    items,
    payments: asList(pick(raw, "payments")).map(mapPayment),
    returns: asList(pick(raw, "returns")).map((row) => mapReturn(row, items)),
    exchanges: asList(pick(raw, "exchanges")).map((row) =>
      mapExchange(row, items),
    ),
    shipments: asList(pick(raw, "shipments")).map(mapShipment),
  };
}
