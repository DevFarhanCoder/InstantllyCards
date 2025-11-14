// Firebase fallback for Expo development environment
// This file provides mock Firebase functions when the native Firebase modules are not available

console.log('🔧 Using Firebase fallback for development environment');

// Mock auth object with the methods we need
export const auth = () => ({
  signInWithPhoneNumber: async (phoneNumber: string) => {
    console.log('📱 [FALLBACK] Mock Firebase OTP sent to:', phoneNumber);
    return {
      verificationId: 'dev-verification-id',
      confirm: async (code: string) => {
        console.log('🔐 [FALLBACK] Mock Firebase OTP verification:', code);
        if (code.length === 6) {
          return {
            user: {
              phoneNumber: phoneNumber,
              uid: 'dev-user-id'
            }
          };
        }
        throw new Error('Invalid OTP format');
      }
    };
  }
});

/**
 * Fallback OTP sending function for development
 */
export const sendOTPViaFirebase = async (phoneNumber: string) => {
  console.log('📱 [FALLBACK] Sending mock OTP to:', phoneNumber);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    confirmation: {
      verificationId: 'dev-verification-id',
      confirm: async (code: string) => {
        if (code.length === 6) {
          return {
            user: {
              phoneNumber: phoneNumber,
              uid: 'dev-user-id'
            }
          };
        }
        throw new Error('Invalid OTP. Please check the code and try again.');
      }
    }
  };
};

/**
 * Fallback OTP verification function for development
 */
export const verifyOTPViaFirebase = async (confirmation: any, code: string) => {
  console.log('🔐 [FALLBACK] Verifying mock OTP:', code);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (code.length === 6) {
    return {
      success: true,
      user: {
        phoneNumber: '+1234567890',
        uid: 'dev-user-id'
      }
    };
  }
  
  throw new Error('Invalid OTP. Please check the code and try again.');
};

export default auth;