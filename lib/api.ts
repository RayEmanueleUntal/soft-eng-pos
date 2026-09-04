import axios from "axios";
import { v4 as uuidv4 } from "uuid";

declare module "axios" {
  export interface AxiosRequestConfig {
    idempotency?: boolean | string;
  }
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  // 1. Mock Role Header (Development environment)
  if (process.env.NODE_ENV !== "production") {
    config.headers["x-mock-role"] = process.env.NEXT_PUBLIC_MOCK_ROLE || "ADMIN";
  }

  // 2. Attach Auth Token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // 3. Dynamic Idempotency-Key Handler
  if (config.idempotency) {
    if (typeof config.idempotency === "string") {
      config.headers["Idempotency-Key"] = config.idempotency;
    } else if (config.idempotency === true) {
      config.headers["Idempotency-Key"] = uuidv4();
    }
  }

  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);