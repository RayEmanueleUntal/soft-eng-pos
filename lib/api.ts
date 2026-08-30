import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Temporary auth token for testing - remove in production
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4xMjMiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODgwNzc4NzQsImV4cCI6MTc4ODA3ODc3NH0.17izYHtcca_49GQjWEpZC-7pCPo2RsKKi9rDgMfsxxc"
  },
});

// Add auth token and idempotency key interceptors
apiClient.interceptors.request.use((config) => {
  // 1. Attach JWT token from storage if available
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 2. Attach Idempotency-Key for transactional routes
  if (config.url?.includes("/pos/checkout") && config.method?.toLowerCase() === "post") {
    let idempotencyKey = sessionStorage.getItem("active_checkout_key");
    if (!idempotencyKey) {
      idempotencyKey = uuidv4();
      sessionStorage.setItem("active_checkout_key", idempotencyKey);
    }
    config.headers["Idempotency-Key"] = idempotencyKey;
  }
  
  return config;
});

// Clear Idempotency Key upon successful response
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/pos/checkout")) {
      sessionStorage.removeItem("active_checkout_key");
    }
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
    }
    return Promise.reject(error);
  }
);
