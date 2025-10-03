import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import Constants from 'expo-constants';
import serverWarmup from "../lib/serverWarmup";

// Import the appropriate notification system based on environment
const isExpoGo = Constants.appOwnership === 'expo';

// Use the NEW v2 notification system for production
const notificationModule = isExpoGo 
  ? require("../lib/notifications-expo-go")
  : require("../lib/notifications-production-v2");

const { registerForPushNotifications, setupNotificationListeners } = notificationModule;

export default function RootLayout() {
  useEffect(() => {
    // Initialize notification system and pre-warm server
    const initApp = async () => {
      console.log('🚀 Initializing app systems...');
      
      // Start server warmup in background (non-blocking)
      serverWarmup.preWarmOnAppStart();
      
      // Initialize notifications
      await registerForPushNotifications();
      
      // Set up notification listeners
      const unsubscribe = setupNotificationListeners();
      
      console.log('✅ App initialization complete');
      
      return unsubscribe;
    };
    
    initApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
