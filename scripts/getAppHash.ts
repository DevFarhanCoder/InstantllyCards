/**
 * Utility to get and log the App Hash for SMS Retriever API
 * Run this script to get your app's hash code
 * 
 * Usage:
 * 1. Import in your app: import './scripts/getAppHash';
 * 2. Or run from any component: getAndLogAppHash();
 */

import * as SmsRetriever from 'expo-sms-retriever';
import { Platform } from 'react-native';

export const getAndLogAppHash = async () => {
  try {
    if (Platform.OS !== 'android') {
      console.log('❌ SMS Retriever is only available on Android');
      return null;
    }

    console.log('\n📱 ===== SMS RETRIEVER APP HASH =====');
    console.log('Getting app signature hash...\n');

    const hash = await SmsRetriever.getHash();
    const finalHash = Array.isArray(hash) ? hash[0] : hash;

    console.log('✅ App Hash Retrieved:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ${finalHash}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Use this hash in your SMS messages:');
    console.log(`   <#> 123456 is your OTP for Instantlly Cards`);
    console.log(`   ${finalHash}`);
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • Development and Production builds have different hashes');
    console.log('   • Always get hash from the current build');
    console.log('   • Send this hash to backend when requesting OTP');
    console.log('   • Backend should include this in SMS message');
    console.log('\n====================================\n');

    return finalHash;
  } catch (error: any) {
    console.error('❌ Error getting app hash:', error);
    console.error('   Make sure you are running on Android device/emulator');
    console.error('   with Google Play Services installed');
    return null;
  }
};

// Auto-run if imported directly
if (__DEV__) {
  // Give some time for console to initialize
  setTimeout(() => {
    getAndLogAppHash();
  }, 2000);
}

export default getAndLogAppHash;
