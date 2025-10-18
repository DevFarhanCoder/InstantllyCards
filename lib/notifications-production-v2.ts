// lib/notifications-production-v2.ts - Rebuilt notification system
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from './api';
import { ensureAuth } from './auth';

/**
 * CRITICAL NOTIFICATION HANDLER CONFIGURATION
 * This controls how notifications behave when received
 * 
 * Updated behavior:
 * - When app is in FOREGROUND: Show system tray notification (like other messaging apps)
 * - When app is in BACKGROUND/CLOSED: Show native system notification
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 [HANDLER] Notification received:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
    
    return {
      // Show system tray notifications even when app is in foreground
      shouldShowAlert: true,       // ✅ Show notification banner
      shouldPlaySound: true,        // ✅ Play sound
      shouldSetBadge: true,         // ✅ Update badge count
      shouldShowBanner: true,       // ✅ Show banner (system tray)
      shouldShowList: true,         // ✅ Add to notification list
    };
  },
});

/**
 * Setup Android Notification Channels (Required for Android 8.0+)
 * Channels control notification priority, sound, vibration
 * 
 * WhatsApp-Style Configuration:
 * - High priority for instant delivery
 * - Custom vibration patterns
 * - LED lights for visual alerts
 * - Show on lock screen
 */
async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  console.log('📱 [ANDROID] Setting up WhatsApp-style notification channels...');

  try {
    // Main default channel - for all general notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#00FF00',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Messages channel - High priority for instant messages
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Personal message notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#25D366', // WhatsApp green
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    // Group messages channel
    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Messages',
      description: 'Group chat notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#25D366',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Contacts channel - Medium priority
    await Notifications.setNotificationChannelAsync('contacts', {
      name: 'Contacts',
      description: 'Contact activity notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 200, 200],
      sound: 'default',
      enableLights: true,
      lightColor: '#0F1111',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Cards channel - Medium priority
    await Notifications.setNotificationChannelAsync('cards', {
      name: 'Cards',
      description: 'Card sharing and creation notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 200, 200],
      sound: 'default',
      enableLights: true,
      lightColor: '#0F1111',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    console.log('✅ [ANDROID] WhatsApp-style notification channels configured successfully');
  } catch (error) {
    console.error('❌ [ANDROID] Failed to setup notification channels:', error);
  }
}

/**
 * Report registration errors to backend for diagnosis
 */
async function reportRegistrationError(error: Error, context: any) {
  try {
    const authToken = await AsyncStorage.getItem('token');
    const phone = await AsyncStorage.getItem('phone');
    
    console.log('📤 [ERROR-REPORT] Sending error to backend...');
    
    await api.post('/notifications/registration-error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      phone,
      timestamp: new Date().toISOString(),
    });
    
    console.log('✅ [ERROR-REPORT] Error reported to backend');
  } catch (reportErr) {
    console.error('❌ [ERROR-REPORT] Failed to report error:', reportErr);
  }
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('📱 [REGISTER] Starting push notification registration...');

  // Setup Android channels first
  await setupAndroidChannels();

  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.warn('⚠️ [REGISTER] Push notifications require a physical device');
    return null;
  }

  try {
    // Step 1: Check current permissions
    console.log('📱 [REGISTER] Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📱 [REGISTER] Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    // Step 2: Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('📱 [REGISTER] Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 [REGISTER] Permission request result:', status);
    }

    if (finalStatus !== 'granted') {
      console.error('❌ [REGISTER] Notification permissions not granted');
      await reportRegistrationError(
        new Error('Notification permissions not granted'),
        { step: 'permissions', status: finalStatus }
      );
      return null;
    }

    console.log('✅ [REGISTER] Notification permissions granted');

    // Step 3: Get Expo Push Token
    console.log('📱 [REGISTER] Getting Expo push token...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('📱 [REGISTER] Project ID:', projectId);

    if (!projectId) {
      console.error('❌ [REGISTER] No project ID found in config');
      await reportRegistrationError(
        new Error('No project ID found in config'),
        { step: 'project_id_check', config: Constants.expoConfig }
      );
      return null;
    }

    console.log('📱 [REGISTER] About to call getExpoPushTokenAsync...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    const token = tokenData.data;
    console.log('🎉 [REGISTER] Push token obtained successfully:', token.substring(0, 20) + '...');
    console.log('🎉 [REGISTER] Full token length:', token.length);

    // Step 4: Store token locally
    await AsyncStorage.setItem('pushToken', token);
    console.log('💾 [REGISTER] Token saved to AsyncStorage');

    // Step 5: Register with backend
    console.log('📱 [REGISTER] About to call registerTokenWithBackend...');
    await registerTokenWithBackend(token);
    console.log('✅ [REGISTER] registerTokenWithBackend completed');

    return token;
  } catch (error: any) {
    console.error('❌ [REGISTER] Error during registration:', error);
    console.error('❌ [REGISTER] Error name:', error?.name);
    console.error('❌ [REGISTER] Error message:', error?.message);
    console.error('❌ [REGISTER] Error stack:', error?.stack);
    
    // Report to backend for diagnosis
    await reportRegistrationError(error, {
      step: 'unknown',
      device: Device.modelName,
      osVersion: Device.osVersion,
    });
    
    return null;
  }
}

/**
 * Register push token with backend server
 */
async function registerTokenWithBackend(pushToken: string) {
  console.log('🔄 [BACKEND] Registering token with backend...');

  try {
    // Check if user is authenticated
    const authToken = await ensureAuth();
    
    if (!authToken) {
      console.log('⏸️ [BACKEND] User not authenticated - storing token as pending');
      await AsyncStorage.setItem('pendingPushToken', pushToken);
      console.log('💾 [BACKEND] Token saved as pending, will register after login');
      return;
    }

    console.log('🔄 [BACKEND] User authenticated, sending token to server...');

    // Retry logic to handle transient failures (network, cold starts)
    const maxAttempts = 3;
    let attempt = 0;
    let registered = false;
    let lastErr: any = null;

    for (attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`⏳ [BACKEND] Registration attempt ${attempt} for token (truncated): ${pushToken?.substring(0,20)}...`);
        const response = await api.post('/notifications/register-token', {
          pushToken,
          platform: Platform.OS,
          deviceInfo: {
            brand: Device.brand,
            modelName: Device.modelName,
            osName: Device.osName,
            osVersion: Device.osVersion,
          }
        });

        console.log('✅ [BACKEND] Token registered successfully:', response);
        await AsyncStorage.removeItem('pendingPushToken');
        console.log('🗑️ [BACKEND] Cleared pending token');
        registered = true;
        break;
      } catch (err: any) {
        lastErr = err;
        console.error(`❌ [BACKEND] Registration attempt ${attempt} failed:`, err?.message || err);
        // If not last attempt, wait using exponential backoff
        if (attempt < maxAttempts) {
          const waitMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
          console.log(`⏳ [BACKEND] Waiting ${waitMs}ms before retrying...`);
          await new Promise(res => setTimeout(res, waitMs));
        }
      }
    }

    if (!registered) {
      console.error('❌ [BACKEND] All registration attempts failed. Reporting persistent failure.');
      try {
        const report = {
          message: lastErr?.message || String(lastErr),
          status: lastErr?.status,
          data: lastErr?.data,
          pushToken: pushToken ? pushToken.substring(0, 30) + '...' : 'NONE',
          attempts: maxAttempts,
          timestamp: new Date().toISOString(),
        };
        console.log('� [BACKEND] Reporting registration failure to diagnostics endpoint:', report);
        await api.post('/notifications/registration-error', report).catch(r => console.error('❌ [BACKEND] Failed to report registration failure:', r));
      } catch (reportErr) {
        console.error('❌ [BACKEND] Error while reporting registration failure:', reportErr);
      }
    }

  } catch (error: any) {
    console.error('❌ [BACKEND] Failed to register token:', error);
    console.error('❌ [BACKEND] Error message:', error?.message || 'Unknown error');
    console.error('❌ [BACKEND] Error status:', error?.status || 'No status');
    console.error('❌ [BACKEND] Error data:', error?.data || 'No data');
    console.error('❌ [BACKEND] Full error object:', JSON.stringify(error, null, 2));
    
    // Report error to backend for debugging
    try {
      const errorData = {
        message: error?.message || 'Unknown error',
        status: error?.status,
        stack: error?.stack,
        data: error?.data,
        pushToken: pushToken ? pushToken.substring(0, 30) + '...' : 'NONE',
        timestamp: new Date().toISOString(),
      };
      console.log('📤 [BACKEND] Reporting error to backend:', errorData);
      await api.post('/notifications/registration-error', errorData);
    } catch (reportError) {
      console.error('❌ [BACKEND] Failed to report error:', reportError);
    }
    
    // DON'T throw error - just store as pending and continue
    // This prevents the "Server error" alert from blocking login
    await AsyncStorage.setItem('pendingPushToken', pushToken);
    console.log('💾 [BACKEND] Stored as pending due to error - user can continue using app');
  }
}

/**
 * Register pending push token after login
 * Called from login/signup screens after successful authentication
 */
export async function registerPendingPushToken() {
  console.log('🔍 [PENDING] Checking for pending push token...');

  try {
    const pendingToken = await AsyncStorage.getItem('pendingPushToken');
    
    if (pendingToken) {
      console.log('📲 [PENDING] Found pending token, registering now...');
      await registerTokenWithBackend(pendingToken);
    } else {
      console.log('ℹ️ [PENDING] No pending token found');
    }
  } catch (error) {
    console.error('❌ [PENDING] Error registering pending token:', error);
  }
}

/**
 * Setup notification event listeners
 * Handles received notifications and user taps
 */
export function setupNotificationListeners() {
  console.log('👂 [LISTENERS] Setting up notification listeners...');

  // Listener for when notification is received (foreground)
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 [FOREGROUND] Notification received while app is open:',{
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
  });

  // Listener for when user taps a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 [TAP] User tapped notification:', {
      title: response.notification.request.content.title,
      body: response.notification.request.content.body,
      data: response.notification.request.content.data,
    });

    handleNotificationTap(response.notification.request.content.data);
  });

  console.log('✅ [LISTENERS] Notification listeners active');

  // Return cleanup function
  return () => {
    console.log('🧹 [LISTENERS] Cleaning up listeners...');
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
function handleNotificationTap(data: any) {
  if (!data) {
    console.log('ℹ️ [TAP] No data in notification, skipping navigation');
    return;
  }

  console.log('🎯 [TAP] Processing notification type:', data.type);

  // Navigate based on notification type
  try {
    switch (data.type) {
      case 'new_message':
        console.log('💬 [TAP] Opening chat with user:', data.senderId);
        router.push(`/chat/${data.senderId}` as any);
        break;
      
      case 'group_message':
        console.log('👥 [TAP] Opening group chat:', data.groupId);
        router.push(`/group-chat/${data.groupId}` as any);
        break;
      
      case 'contact_joined':
        console.log('👤 [TAP] Opening contacts');
        router.push('/contacts/select' as any);
        break;
      
      case 'card_created':
        console.log('🆕 [TAP] Opening home feed to see new card');
        // Navigate to home and pass highlightCardId so UI can highlight newly created card
        router.push({ pathname: '/(tabs)/home', params: { highlightCardId: data.cardId } } as any);
        break;
      
      case 'card_shared':
        console.log('💳 [TAP] Opening received cards and highlighting card:', data.cardId);
        // Navigate to chats tab, received tab and highlight the specific received card
        router.push({ pathname: '/(tabs)/chats', params: { tab: 'received', highlightCardId: data.cardId } } as any);
        break;
      
      case 'group_invite':
        console.log('📨 [TAP] Opening group invite:', data.groupId);
        router.push(`/group-details/${data.groupId}` as any);
        break;
      
      default:
        console.log('🏠 [TAP] Unknown notification type, staying on current screen');
        break;
    }
  } catch (error) {
    console.error('❌ [TAP] Navigation error:', error);
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalNotification(title: string, body: string, data?: any) {
  console.log('📤 [LOCAL] Sending local notification:', { title, body, data });

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ [LOCAL] Local notification sent');
  } catch (error) {
    console.error('❌ [LOCAL] Failed to send local notification:', error);
  }
}

/**
 * Utility functions
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearAllNotifications() {
  console.log('🗑️ [CLEAR] Clearing all notifications');
  await Notifications.dismissAllNotificationsAsync();
}

export async function cancelScheduledNotifications() {
  console.log('🗑️ [CANCEL] Cancelling scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
