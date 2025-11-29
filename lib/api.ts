// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

// In-memory token cache to avoid race conditions between writing AsyncStorage
// and immediate API calls (useful during signup/login flows).
let AUTH_TOKEN_CACHE: string | null = null;

export function setAuthToken(token: string | null) {
  AUTH_TOKEN_CACHE = token;
}

export function clearAuthToken() {
  AUTH_TOKEN_CACHE = null;
}

export function getAuthToken() {
  return AUTH_TOKEN_CACHE;
}
// Try multiple sources for the API base URL
const getApiBase = () => {
  const sources = [
    process.env.EXPO_PUBLIC_API_BASE_SHALINI,
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_SHALINI,
    process.env.EXPO_PUBLIC_API_BASE,
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
    "http://192.168.0.108:8080" // Fallback to local backend
  ];
  
  for (const source of sources) {
    if (source) {
      console.log("✅ Found API base from source:", source);
      return source.replace(/\/$/, "");
    }
  }
  
  return "https://instantlly-cards-backend-6ki0.onrender.com";
};

const BASE = getApiBase();

// Small helper to safely log without passing complex objects directly to
// Metro/HMR console methods (which can sometimes throw when serializing).
function safeLog(...args: any[]) {
  try {
    const safe = args.map(a => {
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a, (_k, v) => {
          if (typeof v === 'bigint') return String(v);
          return v;
        });
      } catch {
        try { return String(a); } catch { return '[unserializable]'; }
      }
    });
    // Use console.log directly but with sanitized strings
    // eslint-disable-next-line no-console
    console.log(...safe);
  } catch (e) {
    try { console.log('safeLog failure:', String(e)); } catch {}
  }
}

function safeError(...args: any[]) {
  try {
    const safe = args.map(a => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    });
    // eslint-disable-next-line no-console
    console.error(...safe);
  } catch (e) {
    try { console.error('safeError failure:', String(e)); } catch {}
  }
}

// Log the BASE URL to debug environment variable issues
safeLog("🌐 API BASE URL:", BASE);
safeLog("🔍 Environment check:", {
  EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE,
  expoConfig: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
  NODE_ENV: process.env.NODE_ENV,
  __DEV__: __DEV__
});

// Optimized timeout for better user experience (15 seconds)
const TIMEOUT_MS = 15000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Json = Record<string, any>;

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Json | FormData,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  // Generate a short request id for correlation (can be overridden via options.headers['X-REQ-ID'])
  const reqId = (options?.headers && options.headers['X-REQ-ID']) || `req-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
  if (__DEV__ && !path.includes('/feedback')) {
    safeLog("🔧 API Request Configuration:");
    safeLog("  - BASE URL:", BASE);
    safeLog("  - Method:", method);
    safeLog("  - Path:", path);
  }
  
  if (!BASE) {
    console.error("❌ No API base URL found!");
    throw new Error("API base URL not configured - Please check your configuration");
  }

  // Prefer in-memory cached token to avoid AsyncStorage write/read races
  const cachedToken = AUTH_TOKEN_CACHE;
  const token = cachedToken ?? await AsyncStorage.getItem("token");
  if (__DEV__) {
    if (cachedToken) safeLog('🔐 Using cached auth token (length):', cachedToken.length);
    else safeLog('🔐 Token from AsyncStorage present?', !!token, 'length:', token?.length ?? 0);
  }

  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  // Attach request id header for backend correlation
  headers['X-REQ-ID'] = reqId;
  
  // Only set Content-Type for JSON, let FormData set its own
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) headers.Authorization = `Bearer ${token}`;

  // Always use the /api prefix since our backend expects it
  const candidates = [
    `${BASE}/api${path.startsWith("/") ? path : `/${path}`}`,
  ];

  if (__DEV__ && !path.includes('/feedback')) {
    safeLog("🎯 API URL Candidates:", candidates, "(reqId:", reqId, ")");
  }

  let lastErr: any;
  for (const url of candidates) {
    let retries = 2; // Reduce retries for faster failure
    
    while (retries > 0) {
      try {
        if (__DEV__ && !path.includes('/feedback')) {
          safeLog(`🚀 Making ${method} request to: ${url} (attempt ${4 - retries}/3) (reqId: ${reqId})`);
          safeLog('📤 Request body:', body instanceof FormData ? 'FormData' : body);
        }
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout triggered after', TIMEOUT_MS / 1000, 'seconds');
          controller.abort();
        }, TIMEOUT_MS);

        const startTime = Date.now();
        const res = await fetch(url, {
          method,
          headers,
          body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
          signal: controller.signal,
        });

        const duration = Date.now() - startTime;
        clearTimeout(timeoutId);
        if (__DEV__) {
          safeLog(`✅ Response received in ${duration}ms - Status: ${res.status} for ${url} (reqId: ${reqId})`);
        }

        let data: any = null;
        const text = await res.text();
        // Only log response in development mode
        if (__DEV__ && !path.includes('/feedback')) {
          safeLog('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''), `(reqId: ${reqId})`);
        }
        
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text || null;
        }

        if (!res.ok) {
          if (__DEV__) {
            safeLog('❌ Error response data:', data);
          }
          // bubble up shape { status, url, data }
          const err = new Error(
            typeof data === "object" && data?.message
              ? data.message
              : `HTTP ${res.status}: ${text || res.statusText}`
          ) as any;
          err.status = res.status;
          err.url = url;
          err.data = data;
          throw err;
        }

        if (__DEV__ && !path.includes('/feedback')) {
          safeLog('🎉 Request successful!');
        }
        return data as T;
      } catch (e: any) {
        safeError(`❌ Request failed for ${url} (attempt ${4 - retries}/3):`, e?.message || e);
        
        // Handle timeout and network errors with better messages
        if (e.name === 'AbortError') {
          lastErr = new Error('Connection timeout. The server might be starting up, please wait a moment and try again.');
          (lastErr as any).status = e.status ?? 0;
          (lastErr as any).data = e.data ?? null;
        } else if (e.message?.includes('Network request failed') || e.message?.includes('Failed to fetch')) {
          lastErr = new Error('Network error - Please check your internet connection and try again.');
          (lastErr as any).status = e.status ?? 0;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status === 404) {
          // Prefer any server-provided message for 404s; fall back to a clearer 'Not found' message.
          const serverMsg = e?.data?.message || e?.message;
          lastErr = new Error(serverMsg || 'Requested resource not found (404).');
          (lastErr as any).status = 404;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status >= 500) {
          lastErr = new Error('Server error. Please try again later.');
          (lastErr as any).status = e.status ?? 500;
          (lastErr as any).data = e.data ?? null;
        } else if (e.status === 401) {
          lastErr = new Error('Authentication required. Please log in again.');
          (lastErr as any).status = 401;
          (lastErr as any).data = e.data ?? null;
        } else {
          // Preserve original error object when possible
          lastErr = e;
        }
        
        retries--;
        
        // If we have retries left and it's a recoverable error, wait before retrying
        if (retries > 0 && (e.name === 'AbortError' || e.message?.includes('Network') || e.message?.includes('Failed to fetch'))) {
          const waitTime = (3 - retries) * 1; // Faster backoff: 1s, 2s
          safeLog(`⏳ Retrying in ${waitTime} seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }
  }
  
  safeError('💥 All API candidates failed, throwing last error:', lastErr?.message || lastErr);
  throw lastErr || new Error("API unreachable - Server may be sleeping. Please try again in a moment.");
}

// Non-critical API calls that shouldn't block user experience
async function requestNonCritical<T>(
  method: HttpMethod,
  path: string,
  body?: Json | FormData,
  options?: { headers?: Record<string, string> }
): Promise<T | null> {
  try {
    return await request<T>(method, path, body, options);
  } catch (error) {
    console.log(`⚠️ Non-critical API call failed: ${method} ${path}`, (error as any)?.message || error);
    return null; // Return null instead of throwing
  }
}

const api = {
  get: <T = any>(p: string) => request<T>("GET", p),
  post: <T = any>(p: string, b?: Json | FormData, options?: { headers?: Record<string, string> }) => 
    request<T>("POST", p, b, options),
  put: <T = any>(p: string, b?: Json) => request<T>("PUT", p, b),
  patch: <T = any>(p: string, b?: Json) => request<T>("PATCH", p, b),
  del: <T = any>(p: string) => request<T>("DELETE", p),
  
  // Non-critical API methods that won't throw errors
  nonCritical: {
    get: <T = any>(p: string) => requestNonCritical<T>("GET", p),
    post: <T = any>(p: string, b?: Json | FormData, options?: { headers?: Record<string, string> }) => 
      requestNonCritical<T>("POST", p, b, options),
    put: <T = any>(p: string, b?: Json) => requestNonCritical<T>("PUT", p, b),
    patch: <T = any>(p: string, b?: Json) => requestNonCritical<T>("PATCH", p, b),
    del: <T = any>(p: string) => requestNonCritical<T>("DELETE", p),
  }
};

export default api;
