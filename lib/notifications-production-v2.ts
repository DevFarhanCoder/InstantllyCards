// lib/notifications-production-v2.ts - Rebuilt notification system
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { ensureAuth } from './auth';

/**
 * CRITICAL NOTIFICATION HANDLER CONFIGURATION
 * This controls how notifications behave when received
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 [HANDLER] Notification received:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
    
    return {
      // ALWAYS show notifications, even when app is in foreground
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

/**
 * Setup Android Notification Channels (Required for Android 8.0+)
 * Channels control notification priority, sound, vibration
 */
async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  console.log('📱 [ANDROID] Setting up notification channels...');

  try {
    // Main channel - for all notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'All Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#4CAF50',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Messages channel
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Group messages channel
    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    console.log('✅ [ANDROID] Notification channels configured successfully');
  } catch (error) {
    console.error('❌ [ANDROID] Failed to setup notification channels:', error);
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
      return null;
    }

    console.log('✅ [REGISTER] Notification permissions granted');

    // Step 3: Get Expo Push Token
    console.log('📱 [REGISTER] Getting Expo push token...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('📱 [REGISTER] Project ID:', projectId);

    if (!projectId) {
      console.error('❌ [REGISTER] No project ID found in config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    const token = tokenData.data;
    console.log('🎉 [REGISTER] Push token obtained successfully:', token.substring(0, 20) + '...');

    // Step 4: Store token locally
    await AsyncStorage.setItem('pushToken', token);
    console.log('💾 [REGISTER] Token saved to AsyncStorage');

    // Step 5: Register with backend
    await registerTokenWithBackend(token);

    return token;
  } catch (error: any) {
    console.error('❌ [REGISTER] Error during registration:', error);
    console.error('❌ [REGISTER] Error details:', {
      message: error.message,
      stack: error.stack,
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
    
    // Clear pending token
    await AsyncStorage.removeItem('pendingPushToken');
    console.log('🗑️ [BACKEND] Cleared pending token');

  } catch (error: any) {
    console.error('❌ [BACKEND] Failed to register token:', error);
    console.error('❌ [BACKEND] Error message:', error?.message || 'Unknown error');
    console.error('❌ [BACKEND] Error status:', error?.status || 'No status');
    console.error('❌ [BACKEND] Error data:', error?.data || 'No data');
    console.error('❌ [BACKEND] Full error object:', JSON.stringify(error, null, 2));
    
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

  // TODO: Add navigation logic based on notification type
  // This requires router integration
  switch (data.type) {
    case 'new_message':
      console.log('💬 [TAP] Opening chat with user:', data.senderId);
      // router.push(`/chat/${data.senderId}`);
      break;
    
    case 'group_message':
      console.log('👥 [TAP] Opening group chat:', data.groupId);
      // router.push(`/group-chat/${data.groupId}`);
      break;
    
    case 'contact_joined':
      console.log('👤 [TAP] Opening contacts');
      // router.push('/contacts');
      break;
    
    case 'card_shared':
      console.log('💳 [TAP] Opening shared card:', data.cardId);
      // router.push(`/card/${data.cardId}`);
      break;
    
    case 'group_invite':
      console.log('📨 [TAP] Opening group invite:', data.groupId);
      // router.push(`/group-details/${data.groupId}`);
      break;
    
    default:
      console.log('🏠 [TAP] Unknown notification type, staying on current screen');
      break;
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
