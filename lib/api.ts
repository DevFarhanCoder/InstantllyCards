// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Production fallback URL
const PRODUCTION_URL = "https://api.instantllycards.com";

const getApiBase = () => {
  const sources = [
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
    Constants.expoConfig?.extra?.API_BASE,
  ];

  for (const source of sources) {
    if (source) {
      console.log(`🔧 [API] Using API Base from config: ${source}`);
      return source.replace(/\/$/, "");
    }
  }

  console.log(`🔧 [API] No config found, using production: ${PRODUCTION_URL}`);
  return PRODUCTION_URL;
};

const BASE = getApiBase();
console.log(`🌐 [API] Final BASE URL: ${BASE}`);

// Timeout for API requests
const TIMEOUT_MS = 120000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Json = Record<string, any>;

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Json | FormData,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  if (!BASE) {
    throw new Error(
      "API base URL not configured - Please check your configuration",
    );
  }

  const token = await AsyncStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  // Only set Content-Type for JSON, let FormData set its own
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  // Always use the /api prefix since our backend expects it
  const candidates = [`${BASE}/api${path.startsWith("/") ? path : `/${path}`}`];

  // Don't retry any auth operations (signup, login, etc.) as they can cause duplicates
  const isAuthRequest = method === "POST" && path.includes("/auth/");
  const maxRetries = isAuthRequest ? 0 : 2;

  let lastErr: any;
  for (const url of candidates) {
    console.log(`🌐 [API-REQUEST] ${method} ${url}`);
    let retries = 2;

    do {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, TIMEOUT_MS);

        const res = await fetch(url, {
          method,
          headers,
          body:
            body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data: any = null;
        const text = await res.text();

        try {
          // Check if response looks like HTML (common error from Render/servers)
          if (text.trim().startsWith("<")) {
            throw new Error(
              "Server error - received HTML error page instead of JSON",
            );
          }
          data = text ? JSON.parse(text) : null;
        } catch (parseError: any) {
          if (parseError.message?.includes("HTML")) {
            throw parseError; // Re-throw our HTML detection error
          }
          data = text || null;
        }

        if (!res.ok) {
          // bubble up shape { status, url, data }
          const err = new Error(
            typeof data === "object" && data?.message
              ? data.message
              : `HTTP ${res.status}: ${text || res.statusText}`,
          ) as any;
          err.status = res.status;
          err.url = url;
          err.data = data;
          throw err;
        }

        return data as T;
      } catch (e: any) {
        // Suppress error logs for quiz endpoints (not implemented yet)
        const isQuizEndpoint = path.includes("/quiz/");

        // Handle timeout and network errors with better messages
        if (e.name === "AbortError") {
          lastErr = new Error(
            "Connection timeout. The server might be starting up, please wait a moment and try again.",
          );
          (lastErr as any).status = e.status ?? 0;
          (lastErr as any).data = e.data ?? null;
        } else if (
          e.message?.includes("Network request failed") ||
          e.message?.includes("Failed to fetch")
        ) {
          lastErr = new Error(
            "Network error - Please check your internet connection and try again.",
          );
          (lastErr as any).status = e.status ?? 0;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status === 404) {
          // For quiz endpoints, don't retry - just fail silently
          if (isQuizEndpoint) {
            lastErr = e;
            retries = 0; // Stop retrying quiz endpoints
            break;
          }
          // Prefer any server-provided message for 404s; fall back to a clearer 'Not found' message.
          const serverMsg = e?.data?.message || e?.message;
          lastErr = new Error(
            serverMsg || "Requested resource not found (404).",
          );
          (lastErr as any).status = 404;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status >= 500) {
          lastErr = new Error("Server error. Please try again later.");
          (lastErr as any).status = e.status ?? 500;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status === 401) {
          lastErr = new Error("Authentication required. Please log in again.");
          (lastErr as any).status = 401;
          (lastErr as any).data = e.data ?? null;
        } else {
          // Preserve original error object when possible
          lastErr = e;
        }

        retries--;

        // If we have retries left and it's a recoverable error, wait before retrying
        if (
          retries > 0 &&
          (e.name === "AbortError" ||
            e.message?.includes("Network") ||
            e.message?.includes("Failed to fetch"))
        ) {
          const waitTime = (3 - retries) * 1; // Faster backoff: 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        }
      }
    } while (retries > 0);
  }

  // Suppress final error log for quiz endpoints
  const isQuizEndpoint = path.includes("/quiz/");
  throw (
    lastErr ||
    new Error(
      "API unreachable - Server may be sleeping. Please try again in a moment.",
    )
  );
}

// Non-critical API calls that shouldn't block user experience
async function requestNonCritical<T>(
  method: HttpMethod,
  path: string,
  body?: Json | FormData,
  options?: { headers?: Record<string, string> },
): Promise<T | null> {
  try {
    return await request<T>(method, path, body, options);
  } catch (error) {
    return null; // Return null instead of throwing
  }
}

const api = {
  // get: <T = any>(p: string, p0: { params: { subcategory: string | string[]; }; }) => request<T>("GET", p),
  get: <T = any>(
    p: string,
    p0?: { params?: Record<string, any> }
  ) => {
    let finalPath = p;

    if (p0?.params) {
      const query = new URLSearchParams();

      Object.entries(p0.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });

      finalPath += `?${query.toString()}`;
    }

    return request<T>("GET", finalPath);
  },

  post: <T = any>(
    p: string,
    b?: Json | FormData,
    options?: { headers?: Record<string, string> },
  ) => request<T>("POST", p, b, options),
  put: <T = any>(p: string, b?: Json) => request<T>("PUT", p, b),
  patch: <T = any>(p: string, b?: Json) => request<T>("PATCH", p, b),
  del: <T = any>(p: string) => request<T>("DELETE", p),

  // Non-critical API methods that won't throw errors
  nonCritical: {
    get: <T = any>(p: string) => requestNonCritical<T>("GET", p),
    post: <T = any>(
      p: string,
      b?: Json | FormData,
      options?: { headers?: Record<string, string> },
    ) => requestNonCritical<T>("POST", p, b, options),
    put: <T = any>(p: string, b?: Json) => requestNonCritical<T>("PUT", p, b),
    patch: <T = any>(p: string, b?: Json) =>
      requestNonCritical<T>("PATCH", p, b),
    del: <T = any>(p: string) => requestNonCritical<T>("DELETE", p),
  },
};

export default api;
