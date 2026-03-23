// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
// Production fallback URL
const PRODUCTION_URL = "https://api-test.instantllycards.com";

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
console.log(`⚠️ [API] No API Base found in config, falling back to default: ${PRODUCTION_URL}`);
  return PRODUCTION_URL;
};

const BASE = getApiBase();
console.log(`🌐 [API] Final BASE URL: ${BASE}`);

// Timeout for API requests
const TIMEOUT_MS = 120000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Json = Record<string, any>;

const API_LOG_REDACT_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "otp",
  "accessToken",
  "refreshToken",
]);

function sanitizeApiLogValue(value: unknown, depth = 0): unknown {
  if (depth > 3) {
    return "[max-depth]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > 20) {
      return {
        length: value.length,
        preview: value
          .slice(0, 20)
          .map((item) => sanitizeApiLogValue(item, depth + 1)),
      };
    }
    return value.map((item) => sanitizeApiLogValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    ).slice(0, 50)) {
      sanitized[key] = API_LOG_REDACT_KEYS.has(key)
        ? "[redacted]"
        : sanitizeApiLogValue(nestedValue, depth + 1);
    }
    return sanitized;
  }

  if (typeof value === "string" && value.length > 300) {
    return `${value.slice(0, 300)}...[truncated ${value.length - 300} chars]`;
  }

  return value;
}

function shouldLogApi(path: string): boolean {
  return (
    path.startsWith("/mlm/") ||
    path.startsWith("/users/profile") ||
    path.startsWith("/credits/search-users")
  );
}

function buildMlmDebugSummary(path: string, data: any): Record<string, unknown> | null {
  if (path.startsWith("/mlm/vouchers")) {
    const vouchers = Array.isArray(data?.vouchers) ? data.vouchers : [];
    return {
      voucherBalance: data?.voucherBalance,
      vouchers: vouchers.map((voucher: any) => ({
        _id: voucher?._id ?? null,
        templateId: voucher?.templateId ?? null,
        voucherNumber: voucher?.voucherNumber ?? null,
        companyName: voucher?.companyName ?? null,
        quantity: voucher?.quantity ?? null,
        isPublished: voucher?.isPublished ?? null,
        isBalanceVoucher: voucher?.isBalanceVoucher ?? null,
        source: voucher?.source ?? null,
      })),
    };
  }

  if (path.startsWith("/mlm/special-credits/dashboard")) {
    return {
      vouchersFigure: data?.dashboard?.vouchersFigure ?? null,
      slots: data?.dashboard?.slots ?? null,
      activeTransfers: Array.isArray(data?.activeTransfers)
        ? data.activeTransfers.map((transfer: any) => ({
            transferId: transfer?.transferId ?? null,
            status: transfer?.status ?? null,
            requiredVoucherCount: transfer?.requiredVoucherCount ?? null,
            currentVoucherCount: transfer?.currentVoucherCount ?? null,
          }))
        : [],
    };
  }

  if (path.startsWith("/mlm/special-credits/slots")) {
    return {
      summary: data?.summary ?? null,
      slotCount: Array.isArray(data?.slots) ? data.slots.length : 0,
    };
  }

  if (path.startsWith("/mlm/special-credits/network")) {
    return {
      summary: data?.summary ?? null,
      networkUsers: Array.isArray(data?.networkUsers)
        ? data.networkUsers.map((user: any) => ({
            slotNumber: user?.slotNumber ?? null,
            name: user?.name ?? null,
            phone: user?.phone ?? null,
            isPlaceholder: user?.isPlaceholder ?? null,
          }))
        : [],
    };
  }

  return null;
}

const PUBLIC_AUTH_ROUTES = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/check-phone",
  "/auth/reset-password",
]);

function isPublicAuthRoute(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return Array.from(PUBLIC_AUTH_ROUTES).some((route) =>
    normalized.startsWith(route),
  );
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    if (typeof atob !== "function") return null;
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

  const publicAuthRoute = isPublicAuthRoute(path);
  const shouldAttachAuth = Boolean(token) && !publicAuthRoute;
  const shouldLogThisRequest = shouldLogApi(path);

  if (shouldAttachAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Temporary auth-debug logs to verify token/header behavior during account switching
  // console.log("[API AUTH DEBUG] Request auth context:", {
  //   method,
  //   path,
  //   hasStoredToken: Boolean(token),
  //   publicAuthRoute,
  //   attachedAuthorization: headers.Authorization
  //     ? `Bearer ...${String(token).slice(-10)}`
  //     : "none",
  // });

  // if (shouldAttachAuth && token) {
  //   console.log("[API AUTH DEBUG] Decoded JWT payload:", decodeJwtPayload(token));
  // }

  // Always use the /api prefix since our backend expects it
  const candidates = [`${BASE}/api${path.startsWith("/") ? path : `/${path}`}`];

  // Don't retry any auth operations (signup, login, etc.) as they can cause duplicates
  const isAuthRequest = method === "POST" && path.includes("/auth/");
  const maxRetries = isAuthRequest ? 0 : 2;

  // Add detailed logging for reviews and enqueries endpoints
  const isReviewEndpoint = path.includes("/reviews");
  const isEnquiryEndpoint = path.includes("/enquiries");
  const isSuggestionEndpoint = path.includes("/suggestions");

  let lastErr: any;
  for (const url of candidates) {
    if (shouldLogThisRequest) {
      console.log("[FRONTEND API REQUEST]", {
        method,
        path,
        url,
        headers: sanitizeApiLogValue(headers),
        body: sanitizeApiLogValue(body),
      });
    }
    if (isReviewEndpoint || isEnquiryEndpoint || isSuggestionEndpoint) {
      console.log(`🌐 [API REQUEST] ${method} ${path}`);
    }
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

          if (shouldLogThisRequest) {
            console.error("[FRONTEND API ERROR]", {
              method,
              path,
              url,
              status: res.status,
              response: sanitizeApiLogValue(data),
              rawText:
                typeof text === "string"
                  ? sanitizeApiLogValue(text)
                  : undefined,
            });
          }
          
          if (isReviewEndpoint || isEnquiryEndpoint || isSuggestionEndpoint) {
            console.error(`❌ [API ERROR] ${method} ${path}`, {
              status: res.status,
              error: err.message,
              errorCode: data?.error,
            });
          }
          throw err;
        }

        if (shouldLogThisRequest) {
          console.log("[FRONTEND API RESPONSE]", {
            method,
            path,
            url,
            status: res.status,
            response: sanitizeApiLogValue(data),
          });
          const debugSummary = buildMlmDebugSummary(path, data);
          if (debugSummary) {
            console.log("[FRONTEND API DEBUG]", {
              method,
              path,
              url,
              summary: sanitizeApiLogValue(debugSummary),
            });
          }
        }

        if (isReviewEndpoint || isEnquiryEndpoint || isSuggestionEndpoint) {
          console.log(`✅ [API SUCCESS] ${method} ${path} - Status: ${res.status}`);
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
  put: <T = any>(p: string, b?: Json, p0?: { headers: { 'Content-Type': string; }; }) => request<T>("PUT", p, b),
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
