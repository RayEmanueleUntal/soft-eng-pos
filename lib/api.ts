import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Temporary auth token for testing - remove in production
    // "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4xMjMiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODgwNzc4NzQsImV4cCI6MTc4ODA3ODc3NH0.17izYHtcca_49GQjWEpZC-7pCPo2RsKKi9rDgMfsxxc"
  },
});

// Add auth token and idempotency key interceptors
apiClient.interceptors.request.use((config) => {
  if (process.env.NODE_ENV !== "production") {
    config.headers["x-mock-role"] =
      process.env.NEXT_PUBLIC_MOCK_ROLE || "ADMIN";
  }

  // 1. Attach JWT token from storage if available
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Attach Idempotency-Key for all mutating routes
  const mutatingMethods = ["post", "put", "patch"];

  if (config.method && mutatingMethods.includes(config.method.toLowerCase())) {
    // Use the URL path as a unique key descriptor for pending requests
    const requestPath = config.url || "";
    let idempotencyKey = sessionStorage.getItem(`idempotency_${requestPath}`);

    if (!idempotencyKey) {
      idempotencyKey = uuidv4();
      sessionStorage.setItem(`idempotency_${requestPath}`, idempotencyKey);
    }

    config.headers["Idempotency-Key"] = idempotencyKey;
  }

  return config;
});

// Clear Idempotency Key upon successful response
apiClient.interceptors.response.use(
  (response) => {
    const mutatingMethods = ["post", "put", "patch"];
    const method = response.config.method?.toLowerCase();

    if (method && mutatingMethods.includes(method)) {
      const requestPath = response.config.url || "";
      sessionStorage.removeItem(`idempotency_${requestPath}`);
    }

    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/signin")
    ) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    // Clear the key on bad user requests (like a 400 Validation Error)
    // so they can fix their input and click save again.
    const method = error.config?.method?.toLowerCase();
    const mutatingMethods = ["post", "put", "patch"];
    if (
      method &&
      mutatingMethods.includes(method) &&
      error.response?.status < 500
    ) {
      const requestPath = error.config.url || "";
      sessionStorage.removeItem(`idempotency_${requestPath}`);
    }

    return Promise.reject(error);
  },
);
