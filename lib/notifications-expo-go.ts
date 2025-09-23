// Simplified notification system for Expo Go compatibility
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';
import { ensureAuth } from './auth';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerForPushNotifications() {
  console.log('📱 Running in Expo Go - Using simplified notification system');
  await AsyncStorage.setItem('usingExpoGo', 'true');
  
  // Register the expo-go-local-mode token with backend
  try {
    const authToken = await ensureAuth();
    if (authToken) {
      await api.post('/notifications/register-token', {
        pushToken: 'expo-go-local-mode',
        platform: Platform.OS
      });
      console.log('✅ Expo Go local mode token registered with backend');
    }
  } catch (error) {
    console.log('Failed to register expo-go token with backend:', error);
  }
  
  return 'expo-go-local-mode';
}

export async function setupLocalNotificationPermissions() {
  console.log('✅ Local notification permissions granted (Expo Go mode)');
  return true;
}

export async function showExpoGoNotification(title: string, body: string, data?: any) {
  console.log('📱 Local notification sent via Expo Go:', title, body);
  // Could show an Alert or use a toast library here
  Alert.alert(title, body);
}

export async function showInAppNotification(title: string, message: string, onPress?: () => void) {
  Alert.alert(
    title,
    message,
    [
      { text: 'Dismiss', style: 'cancel' },
      { text: 'Open', onPress }
    ]
  );
}

export async function scheduleMessageNotification(title: string, body: string, data?: any) {
  console.log('📱 Message notification scheduled (Expo Go mode):', title);
  return showExpoGoNotification(title, body, data);
}

export function setupNotificationListeners() {
  console.log('📱 Notification listeners set up (Expo Go mode)');
  return () => {}; // Return empty cleanup function
}

export async function getBadgeCount() {
  return 0;
}

export async function setBadgeCount(count: number) {
  console.log('📱 Badge count set to:', count);
}