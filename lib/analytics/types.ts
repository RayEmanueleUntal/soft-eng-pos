// Type definitions mirroring the backend Analytics module DTOs.
// Source: soft-eng-pos-api/src/analytics/dto

export type GroupingInterval = "DAILY" | "WEEKLY" | "MONTHLY";

export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARIES_WAGES"
  | "TAXES_LICENCES"
  | "MAINTENANCE"
  | "LOGISTICS"
  | "SUPPLIES"
  | "MISCELLANEOUS";

export type PaymentMethod =
  | "CASH"
  | "GCASH"
  | "CREDIT"
  | "CHECK"
  | "BANK_TRANSFER";

export type VelocitySortBy = "QUANTITY" | "REVENUE";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "UTILITIES",
  "SALARIES_WAGES",
  "TAXES_LICENCES",
  "MAINTENANCE",
  "LOGISTICS",
  "SUPPLIES",
  "MISCELLANEOUS",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "GCASH",
  "CREDIT",
  "CHECK",
  "BANK_TRANSFER",
];

export const GROUPING_INTERVALS: GroupingInterval[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
];

export const AGING_DAY_OPTIONS = [30, 60, 90] as const;

// Shared optional date-range query params (ISO-8601 strings).
export interface AnalyticsDateParams {
  startDate?: string;
  endDate?: string;
}

// GET /analytics/dashboard-summary
export interface MetricValue {
  amount: number;
  margin_percentage: number;
}

export interface DashboardSummary {
  total_sales_revenue: number;
  total_cogs: number;
  gross_profit: MetricValue;
  total_opex: number;
  net_profit: MetricValue;
  total_active_receivables: number;
}

// GET /analytics/sales-performance
export interface SalesTrendPoint {
  date_label: string;
  revenue: number;
  net_profit: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  total_amount: number;
  percentage_share: number;
}

export interface SummaryLedger {
  total_revenue: number;
  total_discounts: number;
  total_cogs: number;
  gross_profit: number;
  gross_profit_margin_percentage: number;
}

export interface SalesPerformance {
  trend: SalesTrendPoint[];
  payment_breakdown: PaymentMethodBreakdown[];
  summary_ledger: SummaryLedger;
}

// GET /analytics/expenses
export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  total_amount: number;
  log_count: number;
  percentage_share: number;
}

export interface ExpenseStaff {
  id: number;
  username: string;
  full_name: string;
}

export interface ExpenseListItem {
  id: number;
  date: string;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  amount: number;
  notes: string | null;
  staff: ExpenseStaff;
}

export interface ExpensePagination {
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export interface ExpenseAnalytics {
  total_opex: number;
  category_breakdown: CategoryBreakdownItem[];
  expense_list: ExpenseListItem[];
  pagination: ExpensePagination;
}

// GET /analytics/inventory-velocity
export interface FastMovingItem {
  productId: number;
  sku: string | null;
  name: string;
  category_name: string;
  base_uom: string;
  current_quantity: number;
  total_base_quantity_sold: number;
  total_revenue: number;
  total_gross_profit: number;
  transaction_count: number;
}

export interface SlowMovingItem {
  productId: number;
  sku: string | null;
  name: string;
  category_name: string;
  bin_location: string;
  base_uom: string;
  current_quantity: number;
  cost_price: number;
  tied_up_capital: number;
  sales_in_aging_period: number;
  last_sale_date: string | null;
  days_without_sales: number;
}

export interface InventoryVelocity {
  fast_moving_items: FastMovingItem[];
  slow_moving_items: SlowMovingItem[];
}

// GET /analytics/accounts-receivable
// Note: this endpoint accepts only `limit` — it is not date-ranged.
export interface CreditOverview {
  total_credit_extended: number;
  total_outstanding_debt: number;
  credit_utilization_percentage: number;
  total_wholesale_accounts: number;
}

export interface ArAgingItem {
  customerId: number;
  company_name: string;
  customer_name: string;
  contact_number: string;
  total_outstanding_balance: number;
  current_amount: number;
  days_1_30_overdue: number;
  days_31_60_overdue: number;
  days_60_plus_overdue: number;
}

export interface TopCreditCustomer {
  customerId: number;
  company_name: string;
  total_sales_volume: number;
  total_settled_payments: number;
  current_outstanding_balance: number;
  promptness_score: number;
}

export interface AccountsReceivable {
  credit_overview: CreditOverview;
  aging_table: ArAgingItem[];
  top_credit_customers: TopCreditCustomer[];
}
