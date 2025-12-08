// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

// Try multiple sources for the API base URL
const getApiBase = () => {
  const sources = [
    process.env.EXPO_PUBLIC_API_BASE,
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
    "https://instantlly-cards-backend-6ki0.onrender.com" // Production fallback
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

// Log the BASE URL to debug environment variable issues
console.log("🌐 API BASE URL:", BASE);
console.log("🔍 Environment check:", {
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
  if (__DEV__ && !path.includes('/feedback')) {
    console.log("🔧 API Request Configuration:");
    console.log("  - BASE URL:", BASE);
    console.log("  - Method:", method);
    console.log("  - Path:", path);
  }
  
  if (!BASE) {
    console.error("❌ No API base URL found!");
    throw new Error("API base URL not configured - Please check your configuration");
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
  const candidates = [
    `${BASE}/api${path.startsWith("/") ? path : `/${path}`}`,
  ];

  if (__DEV__ && !path.includes('/feedback')) {
    console.log("🎯 API URL Candidates:", candidates);
  }

  let lastErr: any;
  for (const url of candidates) {
    let retries = 2; // Reduce retries for faster failure
    
    while (retries > 0) {
      try {
        if (__DEV__ && !path.includes('/feedback')) {
          console.log(`🚀 Making ${method} request to: ${url} (attempt ${4 - retries}/3)`);
          console.log('📤 Request body:', body instanceof FormData ? 'FormData' : JSON.stringify(body, null, 2));
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
          console.log(`✅ Response received in ${duration}ms - Status: ${res.status} for ${url}`);
        }

        let data: any = null;
        const text = await res.text();
        // Only log response in development mode
        if (__DEV__ && !path.includes('/feedback')) {
          console.log('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        }
        
        try {
          // Check if response looks like HTML (common error from Render/servers)
          if (text.trim().startsWith('<')) {
            console.error('❌ Server returned HTML instead of JSON (likely server error page)');
            throw new Error('Server error - received HTML error page instead of JSON');
          }
          data = text ? JSON.parse(text) : null;
        } catch (parseError: any) {
          if (parseError.message?.includes('HTML')) {
            throw parseError; // Re-throw our HTML detection error
          }
          console.error('❌ JSON parse error:', parseError.message);
          console.error('Response was:', text.substring(0, 200));
          data = text || null;
        }

        if (!res.ok) {
          if (__DEV__) {
            console.log('❌ Error response data:', data);
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
          console.log('🎉 Request successful!');
        }
        return data as T;
      } catch (e: any) {
        console.error(`❌ Request failed for ${url} (attempt ${4 - retries}/3):`, e.message);
        
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
          console.log(`⏳ Retrying in ${waitTime} seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }
  }
  
  console.error('💥 All API candidates failed, throwing last error:', lastErr?.message || lastErr);
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
