// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

// Try multiple sources for the API base URL
const getApiBase = () => {
  const sources = [
    process.env.EXPO_PUBLIC_API_BASE,
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
    Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE,
    "https://instantlly-cards-backend.onrender.com" // Fallback
  ];
  
  for (const source of sources) {
    if (source) {
      console.log("✅ Found API base from source:", source);
      return source.replace(/\/$/, "");
    }
  }
  
  return "https://instantlly-cards-backend.onrender.com";
};

const BASE = getApiBase();

// Log the BASE URL to debug environment variable issues
console.log("🌐 API BASE URL:", BASE);
console.log("🔍 Environment check:", {
  EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE,
  expoConfig: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE,
  manifest: Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE,
  NODE_ENV: process.env.NODE_ENV,
  __DEV__: __DEV__
});

// Extended timeout for slow network connections and cold starts (60 seconds)
const TIMEOUT_MS = 60000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Json = Record<string, any>;

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Json | FormData,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  console.log("🔧 API Request Configuration:");
  console.log("  - BASE URL:", BASE);
  console.log("  - Method:", method);
  console.log("  - Path:", path);
  
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

  console.log("🎯 API URL Candidates:", candidates);

  let lastErr: any;
  for (const url of candidates) {
    let retries = 3; // Increase retries for cold starts
    
    while (retries > 0) {
      try {
        console.log(`🚀 Making ${method} request to: ${url} (attempt ${4 - retries}/3)`);
        console.log('📤 Request body:', body instanceof FormData ? 'FormData' : JSON.stringify(body, null, 2));
        
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
        console.log(`✅ Response received in ${duration}ms - Status: ${res.status} for ${url}`);

        let data: any = null;
        const text = await res.text();
        console.log('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text || null;
        }

        if (!res.ok) {
          console.log('❌ Error response data:', data);
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

        console.log('🎉 Request successful!');
        return data as T;
      } catch (e: any) {
        console.error(`❌ Request failed for ${url} (attempt ${4 - retries}/3):`, e.message);
        
        // Handle timeout and network errors with better messages
        if (e.name === 'AbortError') {
          lastErr = new Error('Request timeout - Server may be sleeping. Please try again.');
        } else if (e.message?.includes('Network request failed') || e.message?.includes('Failed to fetch')) {
          lastErr = new Error('Network error - Please check your internet connection and try again.');
        } else if (e.status === 404) {
          lastErr = new Error('API endpoint not found. Please check if the server is running properly.');
        } else if (e.status >= 500) {
          lastErr = new Error('Server error. Please try again later.');
        } else {
          lastErr = e;
        }
        
        retries--;
        
        // If we have retries left and it's a recoverable error, wait before retrying
        if (retries > 0 && (e.name === 'AbortError' || e.message?.includes('Network') || e.message?.includes('Failed to fetch'))) {
          const waitTime = (4 - retries) * 2; // Progressive backoff: 2s, 4s, 6s
          console.log(`⏳ Retrying in ${waitTime} seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }
  }
  
  console.error('💥 All API candidates failed, throwing last error:', lastErr?.message || lastErr);
  throw lastErr || new Error("API unreachable - Server may be sleeping. Please try again in a moment.");
}

const api = {
  get: <T = any>(p: string) => request<T>("GET", p),
  post: <T = any>(p: string, b?: Json | FormData, options?: { headers?: Record<string, string> }) => 
    request<T>("POST", p, b, options),
  put: <T = any>(p: string, b?: Json) => request<T>("PUT", p, b),
  patch: <T = any>(p: string, b?: Json) => request<T>("PATCH", p, b),
  del: <T = any>(p: string) => request<T>("DELETE", p),
};

export default api;
