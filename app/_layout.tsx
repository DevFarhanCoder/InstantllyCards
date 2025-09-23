import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { registerForPushNotifications, setupNotificationListeners } from "../lib/notifications-expo-go";

export default function RootLayout() {
  useEffect(() => {
    // Initialize notification system
    const initNotifications = async () => {
      console.log('🚀 Initializing notification system...');
      await registerForPushNotifications();
      
      // Set up notification listeners
      const unsubscribe = setupNotificationListeners();
      
      console.log('✅ Notification system initialized for Expo Go compatibility');
      
      return unsubscribe;
    };
    
    initNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
