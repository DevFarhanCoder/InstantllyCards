import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { ensureAuth } from './auth';

// Dynamic import to avoid errors in Expo Go
let Notifications: any = null;
let Device: any = null;

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Initialize notifications only if not in Expo Go
const initializeNotifications = async () => {
  if (!isExpoGo) {
    try {
      Notifications = await import('expo-notifications');
      Device = await import('expo-device');
      
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
    } catch (error) {
      console.log('Failed to initialize notifications:', error);
    }
  }
};

export async function registerForPushNotifications() {
  // Always initialize notifications first
  await initializeNotifications();
  
  try {
    let token;

    // Skip push token registration in Expo Go, but still set up local notifications
    if (isExpoGo) {
      console.log('📱 Running in Expo Go - Push notifications disabled since SDK 53');
      console.log('📱 Setting up local notifications and in-app messaging for development');
      await setupLocalNotificationPermissions();
      // Store a flag to indicate we're using Expo Go mode
      await AsyncStorage.setItem('usingExpoGo', 'true');
      return 'expo-go-local-mode';
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }
      
      // Get the token that uniquely identifies this device
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        
        if (!projectId) {
          console.log('📱 No project ID found - this is normal in Expo Go');
          console.log('📱 Using local notifications for development');
          await setupLocalNotificationPermissions();
          await AsyncStorage.setItem('usingExpoGo', 'true');
          return 'expo-go-local-mode';
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('📱 Push notification token:', token);
        
        // Store token locally
        await AsyncStorage.setItem('pushToken', token);
        
        // Send token to backend
        await registerTokenWithBackend(token);
        
      } catch (error) {
        console.log('📱 Push token failed - this is expected in Expo Go SDK 53+');
        console.log('📱 Using local notifications for development');
        await setupLocalNotificationPermissions();
        await AsyncStorage.setItem('usingExpoGo', 'true');
        return 'expo-go-local-mode';
      }
    } else {
      console.log('📱 Not a physical device or using Expo Go - using local notifications');
      await setupLocalNotificationPermissions();
      await AsyncStorage.setItem('usingExpoGo', 'true');
      return 'expo-go-local-mode';
    }

    return token;
  } catch (error) {
    console.log('📱 Notification setup failed, using fallback:', error);
    await setupLocalNotificationPermissions();
    return null;
  }
}

async function setupLocalNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus === 'granted') {
      console.log('✅ Local notification permissions granted');
    } else {
      console.log('❌ Local notification permissions denied');
    }
  } catch (error) {
    console.log('Error setting up local notification permissions:', error);
  }
}

async function registerTokenWithBackend(token: string) {
  try {
    const authToken = await ensureAuth();
    if (authToken) {
      await api.post('/notifications/register-token', {
        pushToken: token,
        platform: Platform.OS
      });
      console.log('✅ Push token registered with backend');
    }
  } catch (error) {
    console.log('Failed to register push token with backend:', error);
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
    console.log(`📱 Local notification scheduled: ${title}`);
  } catch (error) {
    console.log('Error scheduling local notification:', error);
  }
}

export async function scheduleMessageNotification(
  senderName: string,
  messageText: string,
  senderId: string
) {
  await scheduleLocalNotification(
    `New message from ${senderName}`,
    messageText,
    {
      type: 'message',
      senderId,
      senderName
    }
  );
}

// Set up notification listeners
export function setupNotificationListeners() {
  if (isExpoGo || !Notifications) {
    console.log('📱 Skipping notification listeners in Expo Go mode');
    return () => {}; // Return empty cleanup function
  }

  try {
    // Handle notification when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('📥 Notification received in foreground:', notification);
    });

    // Handle notification response (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('📱 Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'message' && data?.senderId) {
        // Navigate to chat screen
        console.log('Should navigate to chat with:', data.senderId);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  } catch (error) {
    console.log('Error setting up notification listeners:', error);
    return () => {}; // Return empty cleanup function
  }
}

export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.log('Error getting badge count:', error);
    return 0;
  }
}

export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.log('Error setting badge count:', error);
  }
}

export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  } catch (error) {
    console.log('Error clearing notifications:', error);
  }
}

// Add in-app notification system for development
export async function showInAppNotification(
  title: string,
  message: string,
  onPress?: () => void
) {
  try {
    // For development, show an alert instead of push notification
    if (isExpoGo || !Device.isDevice) {
      Alert.alert(
        title,
        message,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Open', onPress: onPress }
        ]
      );
    } else {
      // Try to schedule local notification
      await scheduleLocalNotification(title, message);
    }
  } catch (error) {
    console.log('Error showing in-app notification:', error);
    // Fallback to alert
    Alert.alert(title, message);
  }
}

// Expo Go compatible notification function
export async function showExpoGoNotification(title: string, body: string, data?: any) {
  try {
    const usingExpoGo = await AsyncStorage.getItem('usingExpoGo');
    
    if (usingExpoGo === 'true') {
      // Use local notifications for Expo Go
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
      console.log('📱 Local notification sent via Expo Go');
    } else {
      // This would be for development builds with actual push notifications
      console.log('📱 Development build detected - would send push notification');
    }
  } catch (error) {
    console.log('Error showing Expo Go notification:', error);
  }
}