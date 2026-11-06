import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag and subscribers queue to handle concurrent 401 requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ----------------------------------------------------------------------
// 1. Request Interceptor: Attach Access Token & Idempotency Key
// ----------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. Attach Access JWT token from storage if available
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Attach Idempotency-Key for mutating routes (POST, PUT, PATCH)
  const mutatingMethods = ["post", "put", "patch"];
  if (config.method && mutatingMethods.includes(config.method.toLowerCase())) {
    const requestPath = config.url || "";
    let idempotencyKey = sessionStorage.getItem(`idempotency_${requestPath}`);

    if (!idempotencyKey) {
      idempotencyKey = uuidv4();
      sessionStorage.setItem(`idempotency_${requestPath}`, idempotencyKey);
    }

    if (config.headers) {
      config.headers["Idempotency-Key"] = idempotencyKey;
    }
  }

  return config;
});

// ----------------------------------------------------------------------
// 2. Response Interceptor: Idempotency Cleanup & Automatic Refresh
// ----------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    // Clear Idempotency Key upon successful mutating response
    const mutatingMethods = ["post", "put", "patch"];
    const method = response.config.method?.toLowerCase();

    if (method && mutatingMethods.includes(method)) {
      const requestPath = response.config.url || "";
      sessionStorage.removeItem(`idempotency_${requestPath}`);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Clear idempotency key on bad user requests (400 validation error) so they can fix input and retry
    const method = originalRequest?.method?.toLowerCase();
    const mutatingMethods = ["post", "put", "patch"];
    if (
      method &&
      mutatingMethods.includes(method) &&
      error.response?.status &&
      error.response.status < 500
    ) {
      const requestPath = originalRequest.url || "";
      sessionStorage.removeItem(`idempotency_${requestPath}`);
    }

    // Handle 401 Unauthorized errors (Automatic Token Refresh)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/signin") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      // If refresh is already in progress, queue failed requests until refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;

      if (!refreshToken) {
        isRefreshing = false;
        handleLogoutRedirect();
        return Promise.reject(error);
      }

      try {
        // Call backend /auth/refresh endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        const { access_token, refresh_token } = response.data;

        // Persist rotated tokens
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogoutRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to clear tokens and safely redirect to login
function handleLogoutRedirect() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/login";
  }
}
