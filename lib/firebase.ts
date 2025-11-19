// Firebase Phone Authentication for React Native
// Uses @react-native-firebase/auth for native phone verification

let auth: any = null;

// Try to import Firebase, but gracefully handle dev builds where it's not available
try {
  auth = require('@react-native-firebase/auth').default;
} catch (e) {
  console.log('⚠️ Firebase not available in this build - using mock for development');
}

// Firebase auth instance
export { auth };

/**
 * Send OTP to phone number using Firebase Phone Authentication
 * @param phoneNumber - Full phone number with country code (e.g., +911234567890)
 * @returns Promise with confirmation result containing verificationId
 */
export const sendOTPViaFirebase = async (phoneNumber: string) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  if (!auth) {
    console.error('❌ [FIREBASE-SEND] Firebase is not available in development builds. Please use production build for phone verification.');
    throw new Error('Firebase is not available in development builds. Please use production build for phone verification.');
  }
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📤 [FIREBASE-SEND] REQUEST START - ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📱 Phone Number: ${phoneNumber}`);
    console.log(`${'='.repeat(70)}`);
    
    console.log(`⏳ [FIREBASE-SEND] Calling Firebase signInWithPhoneNumber()...`);
    console.log(`   This will trigger Firebase SMS sending on the device`);
    
    // Firebase will automatically send the SMS
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [FIREBASE-SEND] SUCCESS - Firebase accepted the request - ID: ${requestId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Verification ID: ${confirmation.verificationId}`);
    console.log(`   Next: Firebase should send SMS to ${phoneNumber}`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      confirmation,
      verificationId: confirmation.verificationId
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [FIREBASE-SEND] ERROR - ID: ${requestId}`);
    console.error(`📋 Error Code: ${error.code}`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`${'='.repeat(70)}\n`);
    
    // Log specific Firebase errors
    if (error.code === 'auth/invalid-phone-number') {
      console.error('   ⚠️  Invalid phone format. Should be: +{country_code}{number}');
    } else if (error.code === 'auth/too-many-requests') {
      console.error('   ⚠️  Too many requests. Rate limited by Firebase.');
    } else if (error.code === '[CONFIGURATION_NOT_FOUND]') {
      console.error('   ⚠️  Firebase Phone Auth not configured.');
      console.error('   📋 Check: SHA-1 & SHA-256 in Firebase Console');
      console.error('   📋 Check: google-services.json is updated');
    }
    
    throw error;
  }
};

/**
 * Verify OTP code sent to phone number
 * @param confirmation - Confirmation result from sendOTPViaFirebase
 * @param code - 6-digit OTP code entered by user
 * @returns Promise with verification result
 */
export const verifyOTPViaFirebase = async (confirmation: any, code: string) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  if (!auth) {
    console.error('❌ [FIREBASE-VERIFY] Firebase is not available in development builds. Please use production build for phone verification.');
    throw new Error('Firebase is not available in development builds. Please use production build for phone verification.');
  }
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔐 [FIREBASE-VERIFY] REQUEST START - ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 OTP Code: ***${code.slice(-2)}`);
    console.log(`📋 Verification ID: ${confirmation.verificationId}`);
    console.log(`${'='.repeat(70)}`);
    
    console.log(`⏳ [FIREBASE-VERIFY] Sending code to Firebase...`);
    
    // Confirm the code
    const result = await confirmation.confirm(code);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [FIREBASE-VERIFY] SUCCESS - OTP verified - ID: ${requestId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   User Phone: ${result.user.phoneNumber}`);
    console.log(`   User UID: ${result.user.uid}`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      user: result.user,
      phoneNumber: result.user.phoneNumber
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [FIREBASE-VERIFY] ERROR - ID: ${requestId}`);
    console.error(`📋 Error Code: ${error.code}`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`${'='.repeat(70)}\n`);
    
    if (error.code === 'auth/invalid-verification-code') {
      console.error('   ⚠️  Invalid OTP. User entered wrong code.');
    } else if (error.code === 'auth/code-expired') {
      console.error('   ⚠️  OTP has expired. User took too long to enter.');
    } else if (error.code === 'auth/missing-verification-code') {
      console.error('   ⚠️  Verification code is missing.');
    }
    
    throw error;
  }
};

export default auth;