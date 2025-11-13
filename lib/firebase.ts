// Firebase Phone Authentication for React Native
// Uses @react-native-firebase/auth for native phone verification

import auth from '@react-native-firebase/auth';

// Firebase auth instance
export { auth };

/**
 * Send OTP to phone number using Firebase Phone Authentication
 * @param phoneNumber - Full phone number with country code (e.g., +911234567890)
 * @returns Promise with confirmation result containing verificationId
 */
export const sendOTPViaFirebase = async (phoneNumber: string) => {
  try {
    console.log('📱 Sending Firebase OTP to:', phoneNumber);
    
    // Firebase will automatically send the SMS
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    
    console.log('✅ Firebase OTP sent successfully');
    return {
      success: true,
      confirmation,
      verificationId: confirmation.verificationId
    };
  } catch (error: any) {
    console.error('❌ Firebase send OTP error:', error);
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
  try {
    console.log('🔐 Verifying Firebase OTP...');
    
    // Confirm the code
    const result = await confirmation.confirm(code);
    
    console.log('✅ Firebase OTP verified successfully');
    return {
      success: true,
      user: result.user,
      phoneNumber: result.user.phoneNumber
    };
  } catch (error: any) {
    console.error('❌ Firebase verify OTP error:', error);
    
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please check the code and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new code.');
    }
    
    throw error;
  }
};

export default auth;

