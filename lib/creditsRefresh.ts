/**
 * Auto-refresh credits on app version update
 * This runs once when app is updated to force-fetch fresh credits from server
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';

const LAST_VERSION_KEY = 'last_app_version';
const CREDITS_REFRESHED_KEY = 'credits_refreshed_v1.0.48';

/**
 * Check if app was updated and refresh credits if needed
 * Call this in app initialization (_layout.tsx)
 */
export async function checkAndRefreshCreditsOnUpdate() {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    const lastVersion = await AsyncStorage.getItem(LAST_VERSION_KEY);
    
    console.log(`📱 [VERSION] Current: ${currentVersion}, Last: ${lastVersion || 'first install'}`);

    // Check if app was updated
    if (lastVersion && lastVersion !== currentVersion) {
      console.log('🔄 [CREDITS] App updated, refreshing credits from server...');
      
      // Force refresh credits from server
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/credits/balance');
          console.log(`✅ [CREDITS] Refreshed: ${response.credits} credits`);
          
          // Mark as refreshed
          await AsyncStorage.setItem(CREDITS_REFRESHED_KEY, 'true');
        } catch (error) {
          console.log('⚠️ [CREDITS] Failed to refresh (user can pull to refresh later)');
        }
      }
    }

    // Save current version
    await AsyncStorage.setItem(LAST_VERSION_KEY, currentVersion);
    
  } catch (error) {
    console.error('❌ [VERSION] Error checking version:', error);
  }
}

/**
 * Force clear credits cache (for testing)
 */
export async function clearCreditsCache() {
  await AsyncStorage.removeItem(CREDITS_REFRESHED_KEY);
  console.log('🗑️ Credits cache cleared');
}
