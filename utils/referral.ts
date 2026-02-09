import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key used to store a pending referral code until user signs up/logs in
export const PENDING_REFERRAL_KEY = 'pending_referral_code';

/**
 * Safely parse a URL (or Play Store referrer string) for a utm_campaign referral code.
 * This function is defensive: it never throws and is safe to call at startup.
 */
export function parseReferralFromUrl(url?: string | null): string | null {
  try {
    if (!url) return null;

    // Work with a decoded representation to handle encoded referrer parameters
    const decoded = decodeURIComponent(url);

    // 1) Try to find utm_campaign directly on the URL/query string
    const directMatch = decoded.match(/[?&]utm_campaign=([^&]+)/i);
    if (directMatch && directMatch[1]) {
      return directMatch[1];
    }

    // 2) Some Play Store URLs put the payload in a `referrer` query param
    //    e.g. ...&referrer=utm_source%3Dreferral%26utm_campaign%3DREF
    const referrerMatch = decoded.match(/[?&]referrer=([^&]+)/i);
    if (referrerMatch && referrerMatch[1]) {
      const inner = decodeURIComponent(referrerMatch[1]);
      const innerMatch = inner.match(/utm_campaign=([^&]+)/i);
      if (innerMatch && innerMatch[1]) return innerMatch[1];
    }

    return null;
  } catch (error) {
    // Never throw from parsing; return null on any error
    // This keeps startup safe and non-blocking
    console.log('[referral] parseReferralFromUrl error', error);
    return null;
  }
}

/**
 * Capture the initial deep link (if any) and persist a pending referral code.
 * - Non-blocking and safe for production.
 * - Idempotent: if `pending_referral_code` already exists, this is a no-op.
 *
 * Call this after the first render (e.g. in a `useEffect`), do NOT call at module import.
 */
export async function captureInitialReferralIfPresent(): Promise<string | null> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
    if (existing) return existing;

    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) return null;

    const code = parseReferralFromUrl(initialUrl);
    if (code) {
      await AsyncStorage.setItem(PENDING_REFERRAL_KEY, code);
      console.log('[referral] captured pending referral code', code);
      return code;
    }

    return null;
  } catch (error) {
    // Log but do not rethrow — preserve app startup behavior
    console.log('[referral] captureInitialReferralIfPresent error', error);
    return null;
  }
}

/**
 * Utility to read and clear the pending referral code (used after signup/login).
 */
export async function consumePendingReferral(): Promise<string | null> {
  try {
    const code = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
    if (!code) return null;
    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
    return code;
  } catch (error) {
    console.log('[referral] consumePendingReferral error', error);
    return null;
  }
}
