import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Safely import SMS Retriever with fallback
let SmsRetriever: any = null;
let retrieverType: 'native' | 'expo' | 'none' = 'none';

if (Platform.OS === 'android') {
  try {
    SmsRetriever = require('react-native-sms-retriever').default;
    retrieverType = 'native';
    console.log('[SMS Retriever] Using react-native-sms-retriever');
  } catch (e) {
    try {
      SmsRetriever = require('expo-sms-retriever');
      retrieverType = 'expo';
      console.log('[SMS Retriever] Using expo-sms-retriever');
    } catch (e2) {
      console.log('[SMS Retriever] Not available - manual OTP entry only');
      retrieverType = 'none';
    }
  }
}

/**
 * Custom hook for automatic OTP retrieval using Google SMS Retriever API
 * 
 * Features:
 * - Automatically starts SMS listener when enabled
 * - Extracts OTP from incoming SMS
 * - Provides app hash for backend SMS formatting
 * - Handles cleanup on unmount
 * 
 * Usage:
 * ```tsx
 * const { otp, appHash, isListening, startListening, stopListening } = useSmsRetriever();
 * 
 * useEffect(() => {
 *   if (otp) {
 *     console.log('Auto-filled OTP:', otp);
 *     setOtpInput(otp);
 *   }
 * }, [otp]);
 * ```
 */
export const useSmsRetriever = (options?: {
  autoStart?: boolean;
  otpLength?: number;
}) => {
  const { autoStart = true, otpLength = 6 } = options || {};
  
  const [otp, setOtp] = useState<string | null>(null);
  const [appHash, setAppHash] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get the app hash code for SMS Retriever API
   * This hash should be included in the SMS message from backend
   */
  const getAppHash = async () => {
    try {
      if (!SmsRetriever || retrieverType === 'none') {
        setAppHash('');
        return '';
      }

      if (Platform.OS !== 'android') {
        setAppHash('');
        return '';
      }

      // Different methods for different implementations
      let hash: any;
      if (retrieverType === 'native') {
        hash = await SmsRetriever.getAppHash();
      } else if (retrieverType === 'expo') {
        hash = await SmsRetriever.getHash();
      }

      const finalHash = Array.isArray(hash) ? hash[0] : hash;
      
      if (!finalHash || finalHash === 'NOHASH' || finalHash === '') {
        console.log('[SMS Retriever] App hash not available - using empty string');
        setAppHash('');
        return '';
      }
      
      console.log('[SMS Retriever] App Hash:', finalHash);
      setAppHash(finalHash);
      return finalHash;
    } catch (err: any) {
      // Don't log as error, just info
      console.log('[SMS Retriever] Could not get app hash - will use empty string');
      setAppHash('');
      return '';
    }
  };

  /**
   * Start listening for SMS with OTP
   */
  const startListening = async () => {
    try {
      if (!SmsRetriever || retrieverType === 'none') {
        console.log('[SMS Retriever] Not available - manual OTP entry only');
        return false;
      }

      if (Platform.OS !== 'android') {
        return false;
      }

      console.log('[SMS Retriever] Starting SMS listener...');
      
      let started = false;
      
      // Different implementations based on module type
      if (retrieverType === 'native') {
        // react-native-sms-retriever
        started = await SmsRetriever.requestPhoneNumber();
        
        if (started) {
          SmsRetriever.addSmsListener((event: any) => {
            handleSmsReceived(event?.message || event?.value || event);
          });
        }
      } else if (retrieverType === 'expo') {
        // expo-sms-retriever
        started = await SmsRetriever.start();
        
        if (started) {
          SmsRetriever.addListener((event: any) => {
            handleSmsReceived(event?.value || event?.message || event);
          });
        }
      }
      
      if (started) {
        console.log('[SMS Retriever] Listener started successfully');
        setIsListening(true);
        return true;
      } else {
        console.log('[SMS Retriever] Listener not started');
        return false;
      }
    } catch (err: any) {
      console.log('[SMS Retriever] Could not start listener - manual OTP entry available');
      setIsListening(false);
      return false;
    }
  };

  /**
   * Handle received SMS
   */
  const handleSmsReceived = (message: any) => {
    try {
      if (typeof message !== 'string') {
        return;
      }

      console.log('[SMS Retriever] SMS Received');

      // Extract OTP from message
      let extractedOtp: string | null = null;

      // Try multiple patterns to extract OTP
      const patterns = [
        new RegExp(`<#>\\s*(\\d{${otpLength}})`), // After <#>
        new RegExp(`(\\d{${otpLength}})\\s*<#>`), // Before <#>
        new RegExp(`(\\d{${otpLength}})`), // Any digits matching length
      ];

      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          extractedOtp = match[1];
          console.log('[SMS Retriever] OTP Extracted:', extractedOtp);
          break;
        }
      }

      if (extractedOtp) {
        setOtp(extractedOtp);
        console.log('[SMS Retriever] OTP Auto-filled:', extractedOtp);
        stopListening();
      }
    } catch (err: any) {
      console.log('[SMS Retriever] Error processing SMS');
    }
  };

  /**
   * Stop listening for SMS
   */
  const stopListening = () => {
    try {
      if (!SmsRetriever || retrieverType === 'none') return;
      
      console.log('[SMS Retriever] Stopping SMS listener...');
      
      if (retrieverType === 'native' && SmsRetriever.removeSmsListener) {
        SmsRetriever.removeSmsListener();
      } else if (retrieverType === 'expo' && SmsRetriever.removeListener) {
        SmsRetriever.removeListener();
      }
      
      setIsListening(false);
    } catch (err: any) {
      // Ignore errors when stopping
      setIsListening(false);
    }
  };

  /**
   * Reset OTP state
   */
  const resetOtp = () => {
    setOtp(null);
    setError(null);
  };

  // Auto-start listener on mount if enabled
  useEffect(() => {
    if (autoStart && Platform.OS === 'android' && SmsRetriever && retrieverType !== 'none') {
      // Get app hash first
      getAppHash()
        .then(() => {
          // Then start listening
          return startListening();
        })
        .catch((err) => {
          // Silently fail - manual OTP entry is still available
          console.log('[SMS Retriever] Auto-start skipped');
        });
    }

    // Cleanup on unmount
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [autoStart]);

  return {
    otp,
    appHash,
    isListening,
    error,
    startListening,
    stopListening,
    getAppHash,
    resetOtp,
  };
};

/**
 * Helper function to format SMS message for SMS Retriever API
 * This should be used on the backend when sending OTP SMS
 * 
 * @param otp - The OTP code
 * @param appHash - The app hash code
 * @returns Formatted SMS message
 * 
 * Example: "Your OTP is 123456. Do not share it with anyone. <#> AB12cD3efGH"
 */
export const formatSmsForRetriever = (otp: string, appHash: string): string => {
  return `Your OTP is ${otp}. Do not share it with anyone. <#> ${appHash}`;
};

export default useSmsRetriever;
