import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InstallReferrer from '@/utils/InstallReferrer';

const REFERRER_KEY = 'play_store_referrer';
const REFERRER_PROCESSED_KEY = 'referrer_processed';

/**
 * Get Play Store Install Referrer and extract referral code
 * This should be called once on app first launch
 * 
 * NOTE: This only works in production builds installed from Play Store
 * For development testing, use deep links or the test component
 */
export async function getPlayStoreReferrer(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    console.log('📱 [REFERRER] Not Android, skipping referrer check');
    return null;
  }

  try {
    // Check if we've already processed the referrer
    const alreadyProcessed = await AsyncStorage.getItem(REFERRER_PROCESSED_KEY);
    if (alreadyProcessed === 'true') {
      console.log('📱 [REFERRER] Already processed referrer, skipping');
      return null;
    }

    // Check if the native module is available
    if (!InstallReferrer || typeof InstallReferrer.getInstallReferrer !== 'function') {
      console.log('📱 [REFERRER] Native module not available');
      console.log('📱 [REFERRER] This is normal in Expo Go or development builds');
      console.log('📱 [REFERRER] Play Store referrer only works in production builds');
      return null;
    }
    
    console.log('📱 [REFERRER] Getting install referrer from Play Store...');
    const referrerString = await InstallReferrer.getInstallReferrer();
    
    console.log('📱 [REFERRER] Raw referrer data:', referrerString);
    
    if (!referrer || !referrer.installReferrer) {
    console.log('📱 [REFERRER] Raw referrer data:', referrerString);
    
    if (!referrerString) {
      console.log('📱 [REFERRER] No install referrer found');
      return null;
    }

    // Store raw referrer for debugging
    await AsyncStorage.setItem(REFERRER_KEY, referrerString);
    
    // Extract referral code from utm_campaign parameter
    // Expected format: utm_source=referral&utm_campaign=78ML4ZD6
    const referralCode = extractReferralCode(referrerString);
    
    if (referralCode) {
      console.log('🎁 [REFERRER] Referral code extracted:', referralCode);
      // Store in the same key used by deep linking
      await AsyncStorage.setItem('pending_referral_code', referralCode);
      // Mark as processed
      await AsyncStorage.setItem(REFERRER_PROCESSED_KEY, 'true');
      return referralCode;
    } else {
      console.log('📱 [REFERRER] No referral code found in referrer string');
      return null;
    }
  } catch (error: any) {
    console.log('📱 [REFERRER] Could not get Play Store referrer:', error.message);
    console.log('📱 [REFERRER] This is normal in development - use deep links for testing');
    return null;
  }
}

/**
 * Extract referral code from install referrer string
 * Format: utm_source=referral&utm_campaign=REFERRAL_CODE
 */
function extractReferralCode(referrerString: string): string | null {
  try {
    // Decode the URL-encoded string
    const decoded = decodeURIComponent(referrerString);
    console.log('📱 [REFERRER] Decoded referrer:', decoded);
    
    // Parse utm_campaign parameter
    const utmCampaignMatch = decoded.match(/utm_campaign=([A-Z0-9]+)/i);
    
    if (utmCampaignMatch && utmCampaignMatch[1]) {
      return utmCampaignMatch[1].toUpperCase();
    }
    
    return null;
  } catch (error) {
    console.error('❌ [REFERRER] Error extracting referral code:', error);
    return null;
  }
}

/**
 * Reset referrer processing flag (for testing)
 */
export async function resetReferrerProcessing(): Promise<void> {
  await AsyncStorage.removeItem(REFERRER_PROCESSED_KEY);
  await AsyncStorage.removeItem(REFERRER_KEY);
  console.log('🗑️ [REFERRER] Referrer processing reset');
}
