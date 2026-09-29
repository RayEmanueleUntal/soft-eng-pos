import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import { InventoryItem, InventoryResponse, ProductCategory } from "./types";

export interface InventoryFilters {
  search: string;
  size: string | null;
  threadType: string | null;
  material: string | null;
  category: string | null;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [allCategoriesList, setAllCategoriesList] = useState<ProductCategory[]>([]);
  
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    size: null,
    threadType: null,
    material: null,
    category: null,
  });

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;
  
  // Ref to prevent overlapping fetches
  const fetchController = useRef<AbortController | null>(null);

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch all categories once
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<ProductCategory[]>('/product-categories');
        if (mounted && Array.isArray(response.data)) {
          setAllCategoriesList(response.data);
          const catMap: Record<number, string> = {};
          response.data.forEach(c => {
            catMap[c.id] = c.categoryName;
          });
          setCategories(catMap);
        }
      } catch (err) {
        console.error("Failed to fetch all categories:", err);
      }
    };
    fetchCategories();
    return () => { mounted = false; };
  }, []);

  const fetchInventory = useCallback(async (isSilent = false) => {
    if (fetchController.current) {
      fetchController.current.abort();
    }
    const controller = new AbortController();
    fetchController.current = controller;

    try {
      if (!isSilent) setLoading(true);
      setError(null);

      const response = await apiClient.get<InventoryResponse>("/inventory/", {
        params: {
          search: debouncedSearch || undefined,
          size: filters.size || undefined,
          thread: filters.threadType || undefined,
          material: filters.material || undefined,
          categoryId: filters.category ? Number(filters.category) : undefined,
          page,
          limit,
        },
        signal: controller.signal
      });

      setInventory(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch inventory:", err);
      setError("Failed to load inventory.");
      if (!isSilent) setInventory([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [debouncedSearch, filters.size, filters.threadType, filters.material, filters.category, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Polling / Refetch on focus
  useEffect(() => {
    const handleFocus = () => {
      fetchInventory(true);
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchInventory(true);
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchInventory]);

  const setFilter = (key: keyof InventoryFilters, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPage(1);
    }
  };

  return {
    inventory,
    categories,
    allCategoriesList,
    filters,
    setFilter,
    page,
    setPage,
    totalPages,
    loading,
    error,
    refetch: fetchInventory,
  };
}
