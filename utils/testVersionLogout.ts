// utils/testVersionLogout.ts
// TEST UTILITY: Use this to simulate an app update and test the auto-logout feature

import { clearStoredAppVersion } from '../lib/versionCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TESTING ONLY: Simulates an app update scenario
 * 
 * This function:
 * 1. Clears the stored app version (making the app think it just updated)
 * 2. Restarts the app (you need to do this manually)
 * 3. On next launch, the app will detect the version change and auto-logout
 * 
 * HOW TO TEST:
 * 1. Make sure you're logged in
 * 2. Import and call this function from a screen (e.g., Profile tab)
 * 3. Close and reopen the app
 * 4. You should be logged out automatically
 */
export async function simulateAppUpdate() {
  try {
    console.log('🧪 [TEST] Simulating app update...');
    
    // Clear the stored version to trick the app into thinking it updated
    await clearStoredAppVersion();
    
    console.log('✅ [TEST] Stored version cleared');
    console.log('📱 [TEST] Now close and reopen the app to see auto-logout in action');
    console.log('💡 [TEST] The app will detect version change and log you out');
    
    return true;
  } catch (error) {
    console.error('❌ [TEST] Failed to simulate app update:', error);
    return false;
  }
}

/**
 * TESTING ONLY: Check current version status
 */
export async function checkVersionStatus() {
  try {
    const storedVersion = await AsyncStorage.getItem('app_version_stored');
    console.log('📊 [TEST] Version Status:');
    console.log(`   Stored Version: ${storedVersion || 'none'}`);
    console.log(`   Current Version: 1.0.64 (from app.json)`);
    console.log(`   Will logout on next launch: ${!storedVersion ? 'NO (first launch)' : 'NO (versions match)'}`);
  } catch (error) {
    console.error('❌ [TEST] Failed to check version status:', error);
  }
}
