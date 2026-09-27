"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface PosCustomer {
  id: number;
  name: string;
  contactNumber: string;
  type: "RETAIL" | "WHOLESALE";
  companyName?: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
}

interface RawBackendCustomer {
  id: number;
  name: string;
  contact_number?: string;
  type: "RETAIL" | "WHOLESALE" | string;
  wholesale?: {
    customerId: number;
    company_name: string;
    credit_limit: number | string;
    outstanding_balance: number | string;
  } | null;
}

interface CustomerApiResponse {
  data: RawBackendCustomer[];
  total?: number;
}

/**
 * Pure adapter function: maps raw backend customer object to frontend PosCustomer model.
 */
export function toPosCustomer(item: RawBackendCustomer): PosCustomer {
  const isWholesale = item.type?.toUpperCase() === "WHOLESALE";
  const creditLimit = isWholesale ? Number(item.wholesale?.credit_limit ?? 0) : 0;
  const outstandingBalance = isWholesale ? Number(item.wholesale?.outstanding_balance ?? 0) : 0;
  const availableCredit = Math.max(creditLimit - outstandingBalance, 0);

  return {
    id: item.id,
    name: item.name,
    contactNumber: item.contact_number || "",
    type: isWholesale ? "WHOLESALE" : "RETAIL",
    companyName: item.wholesale?.company_name,
    creditLimit,
    outstandingBalance,
    availableCredit,
  };
}

/**
 * Async API fetcher: queries /customers from backend.
 */
async function fetchCustomersApi(): Promise<PosCustomer[]> {
  const response = await apiClient.get<CustomerApiResponse | RawBackendCustomer[]>("/customers", {
    params: { limit: 100 },
  });

  const rawList = Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];

  return rawList.map(toPosCustomer);
}

export function usePosCustomers() {
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomersApi();
      setCustomers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load customers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchCustomersApi()
      .then((data) => {
        if (!ignore) {
          setCustomers(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to load customers";
          setError(message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { customers, loading, error, refetch };
}
