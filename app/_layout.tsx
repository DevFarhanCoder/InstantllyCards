import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { queryClient } from "../lib/query";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";
import serverWarmup from "../lib/serverWarmup";
import ForceUpdateModal from "../components/ForceUpdateModal";
import { checkAppVersion, getCurrentAppVersion, getAppStoreUrl } from "../lib/versionCheck";
import { chatNotificationService } from "@/lib/chat-notifications";
import { socketService } from "@/lib/socket";
import { showInAppNotification } from "@/lib/notifications-expo-go";
import { QueryClientProvider } from "@tanstack/react-query";

// Import the appropriate notification system based on environment
const isExpoGo = Constants.appOwnership === 'expo';

// Use the NEW v2 notification system for production
const notificationModule = isExpoGo 
  ? require("../lib/notifications-expo-go")
  : require("../lib/notifications-production-v2");

const { registerForPushNotifications, setupNotificationListeners } = notificationModule;

export default function RootLayout() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState(getAppStoreUrl());
  const [latestVersion, setLatestVersion] = useState('1.0.0');

  useEffect(() => {
    // Version check disabled
    console.log('ℹ️ [VERSION CHECK] Force update check is disabled');
    setUpdateRequired(false);
  }, []);

  useEffect(() => {
    // Initialize notification system and pre-warm server
    const initApp = async () => {
      console.log('🚀 Initializing app systems...');
      
      // Initialize chat notification service with QueryClient
      chatNotificationService.initialize(queryClient);
      
      // Start server warmup in background (non-blocking)
      serverWarmup.preWarmOnAppStart();
      
      // Initialize notifications
      await registerForPushNotifications();
      
      // Set up notification listeners
      const unsubscribe = setupNotificationListeners();
      
      // Initialize Socket.IO and set up admin transfer listener
      console.log('🔌 Connecting to Socket.IO...');
      await socketService.connect();
      
      const unsubscribeAdminTransfer = socketService.onAdminTransfer(async (data) => {
        console.log('👑 GLOBAL: Received admin transfer notification:', data);
        
        // Save notification to AsyncStorage for UI display in group list
        try {
          const existingNotifications = await AsyncStorage.getItem('admin_transfer_notifications');
          const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
          
          notifications.push({
            groupId: data.groupId,
            groupName: data.groupName,
            fromUser: data.fromUser || 'Unknown',
            message: data.message,
            timestamp: data.timestamp || new Date(),
            seen: false
          });
          
          await AsyncStorage.setItem('admin_transfer_notifications', JSON.stringify(notifications));
          console.log('💾 Saved admin transfer notification to storage');
        } catch (error) {
          console.error('Error saving notification:', error);
        }
      });
      
      console.log('✅ App initialization complete');
      
      return () => {
        unsubscribe?.();
        unsubscribeAdminTransfer();
      };
    };
    
    initApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ForceUpdateModal
        visible={updateRequired}
        updateUrl={updateUrl}
        currentVersion={getCurrentAppVersion()}
        latestVersion={latestVersion}
      />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
