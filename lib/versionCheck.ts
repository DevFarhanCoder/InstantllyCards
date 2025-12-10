import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

export interface VersionCheckResponse {
  success: boolean;
  updateRequired: boolean;
  currentVersion: string;
  minimumVersion: string;
  latestVersion: string;
  updateUrl: string;
  message: string;
}

/**
 * Check if the current app version requires an update
 */
export async function checkAppVersion(): Promise<VersionCheckResponse | null> {
  try {
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const platform = Platform.OS;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 [VERSION API] Checking app version`);
    console.log(`   App Version: ${appVersion}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   API Endpoint: /auth/version-check?version=${appVersion}&platform=${platform}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await api.get<VersionCheckResponse>(
      `/auth/version-check?version=${appVersion}&platform=${platform}`
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [VERSION API] Response received:', JSON.stringify(response, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Extra validation to ensure we don't show modal incorrectly
    if (response && response.success === true && response.updateRequired === false) {
      console.log('✅ [VERSION API] No update required - current version is fine');
      return null;
    }

    if (response && response.updateRequired === true) {
      console.log('⚠️ [VERSION API] UPDATE REQUIRED - Will show force update modal');
    }

    return response;
  } catch (error) {
    console.error('❌ [VERSION API] Version check failed:', error);
    // Return null on error - don't block users if backend is down
    return null;
  }
}

/**
 * Get the current app version
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Get the platform-specific app store URL
 */
export function getAppStoreUrl(): string {
  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/apps/details?id=com.instantllycards.www.twa';
  } else {
    // Update with your iOS App Store ID when available
    return 'https://apps.apple.com/app/YOUR_APP_ID';
  }
}
