import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import Constants from 'expo-constants';
import serverWarmup from "../lib/serverWarmup";
import ForceUpdateModal from "../components/ForceUpdateModal";
import { checkAppVersion, getCurrentAppVersion, getAppStoreUrl } from "../lib/versionCheck";

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
    // Check for app updates on startup
    const performVersionCheck = async () => {
      console.log('🔍 Performing version check...');
      
      try {
        const versionInfo = await checkAppVersion();
        
        if (versionInfo && versionInfo.updateRequired) {
          console.log('⚠️ Update required! Current:', versionInfo.currentVersion, 'Minimum:', versionInfo.minimumVersion);
          setUpdateRequired(true);
          setUpdateUrl(versionInfo.updateUrl);
          setLatestVersion(versionInfo.latestVersion);
        } else {
          console.log('✅ App version is up to date');
          setUpdateRequired(false);
        }
      } catch (error) {
        console.error('❌ Version check error:', error);
        // Don't show update modal on error
        setUpdateRequired(false);
      }
    };

    performVersionCheck();
  }, []);

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
