// API helpers and hooks for the Executive Analytics Dashboard.
// All requests go through apiClient (lib/api.ts); errors surface via getErrorMessage.
// Source contracts: soft-eng-pos-api/src/analytics
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type {
  AccountsReceivable,
  AnalyticsDateParams,
  DashboardSummary,
  ExpenseAnalytics,
  ExpenseCategory,
  GroupingInterval,
  InventoryVelocity,
  PaymentMethod,
  SalesPerformance,
  VelocitySortBy,
} from "./types";

function dateParams(params: AnalyticsDateParams) {
  return {
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
  };
}

export async function getDashboardSummary(
  params: AnalyticsDateParams,
): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>(
    "/analytics/dashboard-summary",
    { params: dateParams(params) },
  );
  return response.data;
}

export async function getSalesPerformance(
  params: AnalyticsDateParams & { interval: GroupingInterval },
): Promise<SalesPerformance> {
  const response = await apiClient.get<SalesPerformance>(
    "/analytics/sales-performance",
    { params: { ...dateParams(params), interval: params.interval } },
  );
  return response.data;
}

export async function getExpenseAnalytics(params: {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory | "";
  payment_method?: PaymentMethod | "";
  page: number;
  limit: number;
}): Promise<ExpenseAnalytics> {
  const response = await apiClient.get<ExpenseAnalytics>(
    "/analytics/expenses",
    {
      params: {
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        category: params.category || undefined,
        payment_method: params.payment_method || undefined,
        page: params.page,
        limit: params.limit,
      },
    },
  );
  return response.data;
}

export async function getInventoryVelocity(params: {
  startDate?: string;
  endDate?: string;
  agingDays: number;
  sortBy: VelocitySortBy;
  limit: number;
}): Promise<InventoryVelocity> {
  const response = await apiClient.get<InventoryVelocity>(
    "/analytics/inventory-velocity",
    {
      params: {
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        agingDays: params.agingDays,
        sortBy: params.sortBy,
        limit: params.limit,
      },
    },
  );
  return response.data;
}

export async function getAccountsReceivable(params?: {
  limit?: number;
}): Promise<AccountsReceivable> {
  const response = await apiClient.get<AccountsReceivable>(
    "/analytics/accounts-receivable",
    { params: { limit: params?.limit } },
  );
  return response.data;
}

interface AnalyticsState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  // True when a refresh re-fetches while previous data stays visible.
  refreshing: boolean;
}

// Shared fetch lifecycle for analytics queries. `queryDeps` are the primitive
// filter values; a change clears stale data, while `refreshKey` bumps (global
// refresh or local refetch) keep previous figures visible with `refreshing`.
function useAnalyticsResource<T>(
  queryDeps: ReadonlyArray<unknown>,
  refreshKey: number,
  enabled: boolean,
  fetcher: () => Promise<T>,
): AnalyticsState<T> & { refetch: () => void } {
  const [state, setState] = useState<AnalyticsState<T>>({
    data: null,
    loading: true,
    error: null,
    refreshing: false,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const depsSignature = JSON.stringify(queryDeps);
  const lastSignature = useRef(depsSignature);

  useEffect(() => {
    // Parameter changes clear stale figures; a bare refresh keeps them visible.
    const paramsChanged = lastSignature.current !== depsSignature;
    lastSignature.current = depsSignature;

    if (!enabled) {
      setState({ data: null, loading: false, error: null, refreshing: false });
      return;
    }

    let mounted = true;
    setState((prev) =>
      paramsChanged
        ? { data: null, loading: true, error: null, refreshing: false }
        : { ...prev, loading: true, refreshing: true, error: null },
    );

    fetcher()
      .then((data) => {
        if (mounted)
          setState({ data, loading: false, error: null, refreshing: false });
      })
      .catch((err: unknown) => {
        if (mounted) {
          setState({
            data: null,
            loading: false,
            refreshing: false,
            error: getErrorMessage(
              err,
              "Failed to load analytics data. Please try again.",
            ),
          });
        }
      });

    return () => {
      mounted = false;
    };
    // depsSignature is derived from queryDeps; callers pass primitive values.
  }, [...queryDeps, depsSignature, refreshKey, enabled, reloadKey]);

  const refetch = () => setReloadKey((key) => key + 1);

  return { ...state, refetch };
}

export function useDashboardSummary(
  params: AnalyticsDateParams,
  refreshKey: number,
  enabled = true,
) {
  return useAnalyticsResource(
    [params.startDate, params.endDate],
    refreshKey,
    enabled,
    () => getDashboardSummary(params),
  );
}

export function useSalesPerformance(
  params: AnalyticsDateParams & { interval: GroupingInterval },
  refreshKey: number,
  enabled = true,
) {
  return useAnalyticsResource(
    [params.startDate, params.endDate, params.interval],
    refreshKey,
    enabled,
    () => getSalesPerformance(params),
  );
}

export function useExpenseAnalytics(
  params: {
    startDate?: string;
    endDate?: string;
    category?: ExpenseCategory | "";
    payment_method?: PaymentMethod | "";
    page: number;
    limit: number;
  },
  refreshKey: number,
  enabled = true,
) {
  return useAnalyticsResource(
    [
      params.startDate,
      params.endDate,
      params.category,
      params.payment_method,
      params.page,
      params.limit,
    ],
    refreshKey,
    enabled,
    () => getExpenseAnalytics(params),
  );
}

export function useInventoryVelocity(
  params: {
    startDate?: string;
    endDate?: string;
    agingDays: number;
    sortBy: VelocitySortBy;
    limit: number;
  },
  refreshKey: number,
  enabled = true,
) {
  return useAnalyticsResource(
    [
      params.startDate,
      params.endDate,
      params.agingDays,
      params.sortBy,
      params.limit,
    ],
    refreshKey,
    enabled,
    () => getInventoryVelocity(params),
  );
}

export function useAccountsReceivable(
  params: { limit: number },
  refreshKey: number,
  enabled = true,
) {
  return useAnalyticsResource(
    [params.limit],
    refreshKey,
    enabled,
    () => getAccountsReceivable(params),
  );
}
