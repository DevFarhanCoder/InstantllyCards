/**
 * Safe Logger - Production-Safe Logging
 * 
 * This logger automatically disables console logging in production builds
 * to prevent JavaScript thread blocking and startup hangs.
 * 
 * In development: Logs to console + remote
 * In production: Only logs to remote (no console blocking)
 */

import Constants from 'expo-constants';
import { logger as remoteLogger } from './remoteLogger';

// Detect if we're in production
const isProduction = !__DEV__ && Constants.appOwnership !== 'expo';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class SafeLogger {
  /**
   * Log info message
   * In production: Only remote logging (non-blocking)
   * In development: Console + remote
   */
  info(message: string, data?: any) {
    if (!isProduction) {
      console.log(`ℹ️ ${message}`, data || '');
    }
    // Always log to remote (async, non-blocking)
    remoteLogger.info(message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any) {
    if (!isProduction) {
      console.warn(`⚠️ ${message}`, data || '');
    }
    remoteLogger.warn(message, data);
  }

  /**
   * Log error message
   * Errors are always logged to console (even in production) for crash reports
   */
  error(message: string, data?: any) {
    // Errors are critical, log to console even in production
    // but wrapped in try-catch to prevent blocking
    try {
      console.error(`❌ ${message}`, data || '');
    } catch (e) {
      // Silently fail if console.error blocks
    }
    remoteLogger.error(message, data);
  }

  /**
   * Log debug message
   * Only logs in development
   */
  debug(message: string, data?: any) {
    if (!isProduction) {
      console.log(`🔍 ${message}`, data || '');
    }
    remoteLogger.debug(message, data);
  }

  /**
   * Force flush logs to remote server
   * Use sparingly - only for critical logs before navigation
   */
  async forceFlush() {
    if (!isProduction) {
      return remoteLogger.forceFlush();
    }
    // In production, don't wait for flush (non-blocking)
    remoteLogger.forceFlush().catch(() => {});
  }

  /**
   * Check if running in production mode
   */
  isProductionMode(): boolean {
    return isProduction;
  }
}

export const safeLogger = new SafeLogger();

// Also export a production-safe console replacement
export const productionSafeConsole = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    try {
      console.error(...args);
    } catch (e) {
      // Prevent blocking
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
};
