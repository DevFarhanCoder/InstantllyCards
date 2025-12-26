/**
 * Remote Logger Service
 * 
 * Logs both to console and optionally to a remote server for debugging
 * startup issues, navigation freezes, and other critical errors.
 * 
 * Usage:
 * import { logger } from '@/lib/remoteLogger';
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Navigation failed', { screen: 'home', error: err });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// Configure your remote logging endpoint here
const REMOTE_LOG_ENDPOINT = 'https://api.instantllycards.com/api/logs';
const ENABLE_REMOTE_LOGGING = true; // Set to false to disable remote logging
const MAX_LOGS_BATCH = 50; // Maximum logs to send in one request
const LOG_FLUSH_INTERVAL = 2000; // Send logs every 2 seconds (faster for debugging)

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  deviceInfo?: DeviceInfo;
  userId?: string;
}

interface DeviceInfo {
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  deviceId?: string;
}

class RemoteLogger {
  private logs: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private userId: string | null = null;

  constructor() {
    this.initializeDeviceInfo();
    this.startFlushTimer();
  }

  /**
   * Gather device information for debugging
   */
  private async initializeDeviceInfo() {
    try {
      this.deviceInfo = {
        brand: Device.brand || 'Unknown',
        model: Device.modelName || 'Unknown',
        osName: Device.osName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        deviceId: Constants.deviceId || 'Unknown',
      };

      // Try to get user ID from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        this.userId = user.id || user._id || null;
      }
    } catch (error) {
      console.error('Failed to initialize device info:', error);
    }
  }

  /**
   * Start periodic log flushing
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, LOG_FLUSH_INTERVAL);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    
    // Create emoji prefix for better console visibility
    const emoji = {
      info: '📱',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level];

    // Console log with emoji for easy identification
    const consoleMessage = `${emoji} [${level.toUpperCase()}] ${message}`;
    if (data) {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage);
    }

    // Store log entry for remote sending
    const logEntry: LogEntry = {
      level,
      message,
      timestamp,
      data: data ? this.sanitizeData(data) : undefined,
      deviceInfo: this.deviceInfo || undefined,
      userId: this.userId || undefined,
    };

    this.logs.push(logEntry);

    // If we have too many logs, flush immediately
    if (this.logs.length >= MAX_LOGS_BATCH) {
      this.flush();
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: any): any {
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      
      // Remove sensitive fields
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'pin'];
      const removeSensitive = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const key in obj) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            removeSensitive(obj[key]);
          }
        }
      };
      
      removeSensitive(sanitized);
      return sanitized;
    } catch {
      return String(data);
    }
  }

  /**
   * Send accumulated logs to remote server
   */
  async flush() {
    if (!ENABLE_REMOTE_LOGGING || this.logs.length === 0) {
      return;
    }

    const logsToSend = [...this.logs];
    this.logs = []; // Clear the queue immediately

    try {
      const response = await fetch(REMOTE_LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          appInfo: {
            version: Application.nativeApplicationVersion,
            buildNumber: Application.nativeBuildVersion,
          }
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send logs to server:', response.status);
        // Don't re-add logs on failure to avoid infinite loop
      }
    } catch (error) {
      // Silently fail - we don't want logging to crash the app
      console.warn('Remote logging failed (non-critical):', error);
    }
  }

  /**
   * Manually flush logs (call before app shutdown)
   */
  async forceFlush() {
    return this.flush();
  }

  /**
   * Stop the flush timer
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Send any remaining logs
  }
}

// Export singleton instance
export const logger = new RemoteLogger();

// Convenience exports for direct import
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, data?: any) => logger.error(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);

// Export for app shutdown
export const flushLogs = () => logger.forceFlush();
