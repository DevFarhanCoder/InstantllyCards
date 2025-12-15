import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Simplified SMS Retriever Hook with better error handling
 * 
 * This version gracefully handles cases where SMS Retriever is not available
 * and allows manual OTP entry as a fallback.
 */

interface SmsRetrieverOptions {
  autoStart?: boolean;
  otpLength?: number;
}

export const useSmsRetrieverSimple = (options?: SmsRetrieverOptions) => {
  const { autoStart = true, otpLength = 6 } = options || {};
  
  const [otp, setOtp] = useState<string | null>(null);
  const [appHash, setAppHash] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  /**
   * Check if SMS Retriever is available
   */
  const checkAvailability = async () => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      // Try to load react-native-sms-retriever
      const RNSmsRetriever = require('react-native-sms-retriever').default;
      if (RNSmsRetriever) {
        setIsAvailable(true);
        return true;
      }
    } catch (e) {
      // Not available
    }

    try {
      // Try expo-sms-retriever as fallback
      const ExpoSmsRetriever = require('expo-sms-retriever');
      if (ExpoSmsRetriever) {
        setIsAvailable(true);
        return true;
      }
    } catch (e) {
      // Not available
    }

    console.log('[SMS Retriever] Module not available - manual OTP entry only');
    setIsAvailable(false);
    return false;
  };

  /**
   * Get app hash for SMS formatting
   */
  const getAppHash = async (): Promise<string> => {
    try {
      if (Platform.OS !== 'android') {
        return '';
      }

      const RNSmsRetriever = require('react-native-sms-retriever').default;
      const hash = await RNSmsRetriever.getAppHash();
      const finalHash = Array.isArray(hash) ? hash[0] : hash;
      
      if (finalHash && finalHash !== 'NOHASH') {
        console.log('[SMS Retriever] App Hash:', finalHash);
        setAppHash(finalHash);
        return finalHash;
      }
    } catch (err) {
      console.warn('[SMS Retriever] Could not get app hash:', err);
    }

    setAppHash('');
    return '';
  };

  /**
   * Start SMS listener
   */
  const startListening = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      const RNSmsRetriever = require('react-native-sms-retriever').default;
      
      console.log('[SMS Retriever] Starting listener...');
      await RNSmsRetriever.requestPhoneNumber();
      
      RNSmsRetriever.addSmsListener((event: any) => {
        const message = event?.message || '';
        console.log('[SMS Retriever] SMS received');

        // Extract OTP
        const patterns = [
          new RegExp(`<#>\\s*(\\d{${otpLength}})`),
          new RegExp(`(\\d{${otpLength}})\\s*<#>`),
          new RegExp(`(\\d{${otpLength}})`),
        ];

        for (const pattern of patterns) {
          const match = message.match(pattern);
          if (match) {
            const extractedOtp = match[1];
            console.log('[SMS Retriever] OTP extracted:', extractedOtp);
            setOtp(extractedOtp);
            stopListening();
            return;
          }
        }
      });

      setIsListening(true);
      return true;
    } catch (err) {
      console.warn('[SMS Retriever] Failed to start:', err);
      setError('Failed to start SMS listener');
      return false;
    }
  };

  /**
   * Stop SMS listener
   */
  const stopListening = () => {
    try {
      const RNSmsRetriever = require('react-native-sms-retriever').default;
      RNSmsRetriever.removeSmsListener();
      setIsListening(false);
    } catch (err) {
      // Ignore errors when stopping
    }
  };

  /**
   * Reset OTP
   */
  const resetOtp = () => {
    setOtp(null);
    setError(null);
  };

  // Initialize on mount
  useEffect(() => {
    checkAvailability().then((available) => {
      if (available && autoStart) {
        getAppHash().then(() => {
          startListening();
        });
      }
    });

    return () => {
      stopListening();
    };
  }, []);

  return {
    otp,
    appHash,
    isListening,
    isAvailable,
    error,
    startListening,
    stopListening,
    getAppHash,
    resetOtp,
  };
};

export default useSmsRetrieverSimple;
