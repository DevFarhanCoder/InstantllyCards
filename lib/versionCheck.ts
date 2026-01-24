import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const APP_VERSION_KEY = 'app_version_stored';

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
    // DEVELOPMENT MODE: Skip version check for local development
    console.log('🔧 [VERSION CHECK] SKIPPED - Development mode');
    return null;
    
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const platform = Platform.OS;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 [VERSION API] Checking app version`);
    console.log(`   App Version: ${appVersion}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   API Endpoint: /auth/version-check?version=${appVersion}&platform=${platform}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Add 8-second timeout to API call
    const timeoutPromise = new Promise<VersionCheckResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Version check API timeout after 8s')), 8000);
    });

    const response = await Promise.race([
      api.get<VersionCheckResponse>(
        `/auth/version-check?version=${appVersion}&platform=${platform}`
      ),
      timeoutPromise
    ]);

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

/**
 * Check if the app version has changed since last launch.
 * If version changed, clear all auth data (logout) and update stored version.
 * This ensures users start fresh after updating the app.
 * 
 * @returns {Promise<boolean>} Returns true if user was logged out due to version change
 */
export async function checkAndHandleVersionChange(): Promise<boolean> {
  try {
    // Get current app version from app.json
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    console.log(`📱 [VERSION CHECK] Current app version: ${currentVersion}`);

    // Get previously stored version
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    console.log(`💾 [VERSION CHECK] Stored app version: ${storedVersion || 'none'}`);

    // If no stored version, this is first launch - just save current version
    if (!storedVersion) {
      console.log(`✨ [VERSION CHECK] First launch detected - storing version ${currentVersion}`);
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
      return false;
    }

    // If versions match, no action needed
    if (storedVersion === currentVersion) {
      console.log(`✅ [VERSION CHECK] Version unchanged - no logout needed`);
      return false;
    }

    // Version changed - user updated the app!
    console.log(`🔄 [VERSION CHECK] App updated from ${storedVersion} to ${currentVersion}`);
    console.log(`🚪 [VERSION CHECK] Logging out user to clear cached data...`);

    // Clear all authentication and user data
    await AsyncStorage.multiRemove([
      'token',
      'user',
      'user_name',
      'user_phone',
      'currentUserId',
      'contactsSynced',
      'contactsSyncTimestamp',
      'login_prefill_phone',
      'reset_phone',
      'password_just_reset',
      'pendingPushToken',
      'adminAuthToken',
    ]);

    console.log(`🧹 [VERSION CHECK] Auth data cleared`);

    // Update stored version to current version
    await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
    console.log(`💾 [VERSION CHECK] Version updated to ${currentVersion}`);

    console.log(`✅ [VERSION CHECK] User logged out successfully due to app update`);
    return true;
  } catch (error) {
    console.error(`❌ [VERSION CHECK] Error during version check:`, error);
    // On error, don't logout - better to keep user logged in than fail
    return false;
  }
}

/**
 * Get the current stored app version
 */
export async function getStoredAppVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(APP_VERSION_KEY);
  } catch (error) {
    console.error('Error getting stored app version:', error);
    return null;
  }
}

/**
 * Manually clear the stored app version (for testing)
 */
export async function clearStoredAppVersion(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_VERSION_KEY);
    console.log('✅ Stored app version cleared');
  } catch (error) {
    console.error('Error clearing stored app version:', error);
  }
}
