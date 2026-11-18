export type SortKey =
  | "DEFAULT"
  | "NAME_ASC"
  | "NAME_DESC"
  | "CREDIT_LIMIT_ASC"
  | "CREDIT_LIMIT_DESC"
  | "OUTSTANDING_ASC"
  | "OUTSTANDING_DESC"
  | "STOCK_ASC"
  | "STOCK_DESC"
  | "RETAIL_DESC"
  | "RETAIL_ASC"
  | "COST_DESC"
  | "COST_ASC"
  | "WHOLESALE_DESC"
  | "WHOLESALE_ASC"
  | "TOTAL_COST_DESC"
  | "TOTAL_COST_ASC"
  | "DATE_DESC"
  | "DATE_ASC"
  | "ID_ASC"
  | "ID_DESC";

/**
 * Maps frontend SortKey to NestJS backend query params (?sortBy=...&sortOrder=...)
 * Use this for server-paginated endpoints like GET /products.
 */
export function mapSortKeyToApiParams(sortKey: SortKey): {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "NAME_ASC":
      return { sortBy: "name", sortOrder: "asc" };
    case "NAME_DESC":
      return { sortBy: "name", sortOrder: "desc" };
    case "COST_ASC":
      return { sortBy: "cost_price", sortOrder: "asc" };
    case "COST_DESC":
      return { sortBy: "cost_price", sortOrder: "desc" };
    case "RETAIL_ASC":
      return { sortBy: "retail_price", sortOrder: "asc" };
    case "RETAIL_DESC":
      return { sortBy: "retail_price", sortOrder: "desc" };
    case "WHOLESALE_ASC":
      return { sortBy: "wholesale_price", sortOrder: "asc" };
    case "WHOLESALE_DESC":
      return { sortBy: "wholesale_price", sortOrder: "desc" };
    case "STOCK_ASC":
      return { sortBy: "current_quantity", sortOrder: "asc" };
    case "STOCK_DESC":
      return { sortBy: "current_quantity", sortOrder: "desc" };
    case "DATE_ASC":
      return { sortBy: "createdAt", sortOrder: "asc" };
    case "DATE_DESC":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "ID_ASC":
      return { sortBy: "id", sortOrder: "asc" };
    case "ID_DESC":
      return { sortBy: "id", sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Let backend apply its default sort (createdAt DESC, id DESC)
  }
}

export interface SortAccessors<T> {
  getName?: (item: T) => string;
  getStock?: (item: T) => number;
  getRetail?: (item: T) => number;
  getCost?: (item: T) => number;
  getDate?: (item: T) => string | number | Date;
  getId?: (item: T) => number;
}

/**
 * Maps frontend SortKey to NestJS GET /inventory/movements query params
 * (?sortBy=name|quantity_changed|date&sortOrder=asc|desc)
 */
export function mapMovementSortKeyToApiParams(sortKey: SortKey): {
  sortBy?: "name" | "quantity_changed" | "date";
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "NAME_ASC":
      return { sortBy: "name", sortOrder: "asc" };
    case "NAME_DESC":
      return { sortBy: "name", sortOrder: "desc" };
    case "STOCK_ASC":
      return { sortBy: "quantity_changed", sortOrder: "asc" };
    case "STOCK_DESC":
      return { sortBy: "quantity_changed", sortOrder: "desc" };
    case "DATE_ASC":
      return { sortBy: "date", sortOrder: "asc" };
    case "DATE_DESC":
      return { sortBy: "date", sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Backend defaults to sortBy=date, sortOrder=desc
  }
}

/**
 * Maps frontend SortKey to NestJS GET /suppliers query params
 * (?sort_by=name|lead_time_days&sort_order=asc|desc)
 */
export function mapSupplierSortKeyToApiParams(sortKey: SortKey): {
  sort_by?: "name" | "lead_time_days";
  sort_order?: "asc" | "desc";
} {
  switch (sortKey) {
    case "NAME_ASC":
      return { sort_by: "name", sort_order: "asc" };
    case "NAME_DESC":
      return { sort_by: "name", sort_order: "desc" };
    case "STOCK_ASC":
      return { sort_by: "lead_time_days", sort_order: "asc" };
    case "STOCK_DESC":
      return { sort_by: "lead_time_days", sort_order: "desc" };
    case "DEFAULT":
    default:
      return {}; // Let backend apply its default sort (id DESC)
  }
}

/**
 * Maps frontend SortKey to NestJS GET /purchase-orders query params
 * (?sortBy=order_date|grand_total|supplier|id&sortOrder=asc|desc)
 */
export function mapPurchaseOrderSortKeyToApiParams(sortKey: SortKey): {
  sortBy?: "order_date" | "grand_total" | "supplier" | "id";
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "DATE_ASC":
      return { sortBy: "order_date", sortOrder: "asc" };
    case "DATE_DESC":
      return { sortBy: "order_date", sortOrder: "desc" };
    case "TOTAL_COST_ASC":
      return { sortBy: "grand_total", sortOrder: "asc" };
    case "TOTAL_COST_DESC":
      return { sortBy: "grand_total", sortOrder: "desc" };
    case "NAME_ASC":
      return { sortBy: "supplier", sortOrder: "asc" };
    case "NAME_DESC":
      return { sortBy: "supplier", sortOrder: "desc" };
    case "ID_ASC":
      return { sortBy: "id", sortOrder: "asc" };
    case "ID_DESC":
      return { sortBy: "id", sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Backend defaults to sortBy=order_date, sortOrder=desc
  }
}

/**
 * Maps frontend SortKey to NestJS GET /deliveries query params
 * (?sortBy=delivery_date&sortOrder=asc|desc)
 */
export function mapDeliverySortKeyToApiParams(sortKey: SortKey): {
  sortBy?: "delivery_date";
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "DATE_ASC":
      return { sortBy: "delivery_date", sortOrder: "asc" };
    case "DATE_DESC":
      return { sortBy: "delivery_date", sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Backend defaults to sortBy=delivery_date, sortOrder=desc
  }
}

/**
 * Maps frontend SortKey to NestJS GET /forwarders query params (?sortOrder=asc|desc)
 */
export function mapForwarderSortKeyToApiParams(sortKey: SortKey): {
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "NAME_ASC":
      return { sortOrder: "asc" };
    case "NAME_DESC":
      return { sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Backend defaults to createdAt DESC
  }
}

/**
 * Maps customers
 */
export function mapCustomerSortKeyToApiParams(sortKey: SortKey): {
  sortBy?: "createdAt" | "name" | "credit_limit" | "outstanding_balance";
  sortOrder?: "asc" | "desc";
} {
  switch (sortKey) {
    case "NAME_ASC":
      return { sortBy: "name", sortOrder: "asc" };
    case "NAME_DESC":
      return { sortBy: "name", sortOrder: "desc" };
    case "CREDIT_LIMIT_ASC":
      return { sortBy: "credit_limit", sortOrder: "asc" };
    case "CREDIT_LIMIT_DESC":
      return { sortBy: "credit_limit", sortOrder: "desc" };
    case "OUTSTANDING_ASC":
      return { sortBy: "outstanding_balance", sortOrder: "asc" };
    case "OUTSTANDING_DESC":
      return { sortBy: "outstanding_balance", sortOrder: "desc" };
    case "DEFAULT":
    default:
      return {}; // Defaults to backend createdAt DESC
  }
}

export function sortItems<T>(
  items: readonly T[],
  sortKey: SortKey,
  accessors: SortAccessors<T>,
): T[] {
  if (sortKey === "DEFAULT") return [...items];

  const copy = [...items];

  copy.sort((a, b) => {
    switch (sortKey) {
      case "NAME_ASC":
        return (accessors.getName?.(a) ?? "").localeCompare(
          accessors.getName?.(b) ?? "",
          undefined,
          { sensitivity: "base" },
        );
      case "NAME_DESC":
        return (accessors.getName?.(b) ?? "").localeCompare(
          accessors.getName?.(a) ?? "",
          undefined,
          { sensitivity: "base" },
        );
      case "STOCK_ASC":
        return (accessors.getStock?.(a) ?? 0) - (accessors.getStock?.(b) ?? 0);
      case "STOCK_DESC":
        return (accessors.getStock?.(b) ?? 0) - (accessors.getStock?.(a) ?? 0);
      case "RETAIL_ASC":
        return (
          (accessors.getRetail?.(a) ?? 0) - (accessors.getRetail?.(b) ?? 0)
        );
      case "RETAIL_DESC":
        return (
          (accessors.getRetail?.(b) ?? 0) - (accessors.getRetail?.(a) ?? 0)
        );
      case "COST_ASC":
        return (accessors.getCost?.(a) ?? 0) - (accessors.getCost?.(b) ?? 0);
      case "COST_DESC":
        return (accessors.getCost?.(b) ?? 0) - (accessors.getCost?.(a) ?? 0);
      case "DATE_ASC":
        return (
          new Date(accessors.getDate?.(a) ?? 0).getTime() -
          new Date(accessors.getDate?.(b) ?? 0).getTime()
        );
      case "DATE_DESC":
        return (
          new Date(accessors.getDate?.(b) ?? 0).getTime() -
          new Date(accessors.getDate?.(a) ?? 0).getTime()
        );
      case "ID_ASC":
        return (accessors.getId?.(a) ?? 0) - (accessors.getId?.(b) ?? 0);
      case "ID_DESC":
        return (accessors.getId?.(b) ?? 0) - (accessors.getId?.(a) ?? 0);
      default:
        return 0;
    }
  });

  return copy;
}
