"use client";

import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "@/lib/utils";
import {
  fetchCustomersApi,
  toPosCustomer,
  type RawBackendCustomer,
  type CustomerApiResponse,
} from "../services/pos-api";

export { toPosCustomer, type RawBackendCustomer, type CustomerApiResponse };

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
      setError(getErrorMessage(err, "Failed to load customers"));
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
          setError(getErrorMessage(err, "Failed to load customers"));
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
