// lib/notifications-production.ts - Production notification system
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { ensureAuth } from './auth';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Check if running in development vs production
const isDevelopment = __DEV__;
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerForPushNotifications(): Promise<string | null> {
  let token = null;

  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log('📱 Push notifications require a physical device');
    return null;
  }

  try {
    // Get existing notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('📱 Notification permissions not granted');
      return null;
    }

    // Get the push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    token = tokenData.data;
    console.log('🔔 Push token obtained:', token);

    // Store token locally
    await AsyncStorage.setItem('pushToken', token);

    // Register token with backend
    await registerTokenWithBackend(token);

    return token;
  } catch (error) {
    console.error('📱 Error getting push token:', error);
    return null;
  }
}

async function registerTokenWithBackend(pushToken: string) {
  try {
    const authToken = await ensureAuth();
    if (!authToken) {
      console.log('⏸️ Skipping token registration - user not authenticated');
      return;
    }

    console.log('🔔 Registering push token with backend...');
    const result = await api.post('/notifications/register-token', {
      pushToken,
      platform: Platform.OS,
      deviceInfo: {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      }
    });

    console.log('✅ Push token registered with backend successfully');
  } catch (error) {
    console.error('❌ Failed to register push token with backend:', error);
  }
}

// Set up notification listeners for foreground, background, and killed app states
export function setupNotificationListeners() {
  // Handle notifications when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received in foreground:', notification);
    
    // You can customize foreground notification display here
    // For now, let the system handle it
  });

  // Handle notification taps (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    handleNotificationTap(data);
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Handle different types of notification taps
function handleNotificationTap(data: any) {
  console.log('🎯 Handling notification tap with data:', data);
  
  if (!data) return;

  // Handle different notification types
  switch (data.type) {
    case 'new_message':
      // Navigate to chat screen
      // router.push(`/chat/${data.senderId}`);
      break;
    
    case 'group_message':
      // Navigate to group chat screen
      // router.push(`/group-chat/${data.groupId}`);
      break;
    
    case 'contact_joined':
      // Navigate to contacts or show contact profile
      // router.push('/contacts');
      break;
    
    case 'card_shared':
      // Navigate to received cards or card detail
      // router.push(`/card/${data.cardId}`);
      break;
    
    case 'group_invite':
      // Navigate to group details or join group screen
      // router.push(`/group-details/${data.groupId}`);
      break;
    
    default:
      // Default action - navigate to home
      // router.push('/home');
      break;
  }
}

// Send local notification (for testing)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

// Schedule notification for later
export async function scheduleNotification(
  title: string, 
  body: string, 
  trigger: Notifications.NotificationTriggerInput,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger,
  });
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

// Clear all notifications
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

// Cancel scheduled notifications
export async function cancelScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}