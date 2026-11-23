"use client";

import { useState, useEffect, useCallback } from "react";

export function useFormDraft<T>(storageKey: string, initialValues: T) {
  const [values, setValues] = useState<T>(() => {
    if (typeof window === "undefined") return initialValues;
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? { ...initialValues, ...JSON.parse(saved) } : initialValues;
    } catch {
      return initialValues;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Ignore storage quota errors
    }
  }, [storageKey, values]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setValues(initialValues);
  }, [storageKey, initialValues]);

  return [values, setValues, clearDraft] as const;
}