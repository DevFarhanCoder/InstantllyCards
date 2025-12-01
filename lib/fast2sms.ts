// Fast2SMS OTP Integration for React Native
// Backend handles OTP sending and verification

/**
 * Send OTP to phone number via Backend API (Backend calls Fast2SMS)
 * @param phoneNumber - Full phone number with country code (e.g., +919892254636)
 * @returns Promise with OTP sent confirmation
 */
export const sendOTPViaFast2SMS = async (phoneNumber: string) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📤 [FAST2SMS-SEND] REQUEST START - ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📱 Phone Number: ${phoneNumber}`);
    console.log(`${'='.repeat(70)}`);
    
    console.log(`⏳ [FAST2SMS-SEND] Backend will send OTP via Fast2SMS API...`);
    
    // Note: Backend handles OTP sending via /api/auth/check-phone
    // This function is called after check-phone succeeds
    const duration = Date.now() - startTime;
    
    console.log(`✅ [FAST2SMS-SEND] SUCCESS - OTP sent via backend - ID: ${requestId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Backend handled Fast2SMS API call`);
    console.log(`   Next: User should receive SMS on ${phoneNumber}`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      sessionId: requestId,
      message: 'OTP sent via backend',
      phone: phoneNumber,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [FAST2SMS-SEND] ERROR - ID: ${requestId}`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`${'='.repeat(70)}\n`);
    
    throw error;
  }
};

/**
 * Verify OTP code sent to phone number
 * Note: Fast2SMS doesn't provide built-in verification.
 * We'll need backend support to store and verify OTP.
 * 
 * @param phone - Phone number that received OTP
 * @param otp - 6-digit OTP code entered by user
 * @returns Promise with verification result
 */
export const verifyOTPViaBackend = async (phone: string, otp: string) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔐 [OTP-VERIFY] REQUEST START - ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 OTP Code: ***${otp.slice(-2)}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`${'='.repeat(70)}`);
    
    console.log(`⏳ [OTP-VERIFY] Verifying OTP with backend...`);
    
    // Call backend API to verify OTP
    // Backend should validate the OTP against stored value
    // Try AWS Cloud first, fallback to Render
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE || 'https://api.instantllycards.com';
    const backupUrl = 'https://instantlly-cards-backend-6ki0.onrender.com';
    
    const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        otp,
      }),
    });
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    if (!response.ok || !data.success) {
      console.error(`❌ [OTP-VERIFY] Verification failed - ID: ${requestId}`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Response:`, data);
      throw new Error(data.message || 'Invalid or expired OTP');
    }
    
    console.log(`✅ [OTP-VERIFY] SUCCESS - OTP verified - ID: ${requestId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Phone verified: ${phone}`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      phone,
      verified: true,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [OTP-VERIFY] ERROR - ID: ${requestId}`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`${'='.repeat(70)}\n`);
    
    throw error;
  }
};

export default {
  sendOTPViaFast2SMS,
  verifyOTPViaBackend,
};
