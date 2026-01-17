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
import * as Linking from 'expo-linking';
import { getPlayStoreReferrer } from "@/lib/playStoreReferrer";
import { checkAndRefreshCreditsOnUpdate } from "@/lib/creditsRefresh";
import { CreditsProvider } from "@/contexts/CreditsContext";

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
    // Single lightweight initialization - everything else runs in background
    const initApp = async () => {
      console.log('🚀 [INIT] App starting (lightweight mode)...');
      
      // STEP 1: Check if app was updated and refresh credits if needed
      checkAndRefreshCreditsOnUpdate().catch(() => {});
      
      // STEP 2: Only initialize critical services synchronously
      chatNotificationService.initialize(queryClient);
      console.log('✅ [INIT] Chat notifications initialized');
      
      // STEP 3: All heavy operations run in background after 1 second
      setTimeout(async () => {
        console.log('🔄 [BACKGROUND] Starting background tasks...');
        
        // Version check (5s timeout, runs in background)
        setTimeout(async () => {
          try {
            console.log('🔍 [VERSION] Checking version...');
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => reject(new Error('Version check timeout')), 5000);
            });
            const versionInfo = await Promise.race([checkAppVersion(), timeoutPromise]);
            
            if (versionInfo && versionInfo.updateRequired) {
              setUpdateRequired(true);
              setUpdateUrl(versionInfo.updateUrl);
              setLatestVersion(versionInfo.latestVersion);
              console.log('⚠️ [VERSION] Update required!');
            }
          } catch (error) {
            console.log('⚠️ [VERSION] Check failed (non-critical):', error);
          }
        }, 2000); // Check version after 2 seconds
        
        // Play Store referrer (non-blocking)
        getPlayStoreReferrer().then(code => {
          if (code) console.log('🎁 [REFERRER] Captured:', code);
        }).catch(() => {});
        
        // Server warmup (non-blocking, has internal timeout)
        serverWarmup.preWarmOnAppStart().catch(() => {});
        
        // Notifications (15s timeout, non-blocking)
        setTimeout(() => {
          const notificationTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Notification timeout')), 15000);
          });
          Promise.race([registerForPushNotifications(), notificationTimeout])
            .then(() => console.log('✅ [NOTIFICATIONS] Registered'))
            .catch(() => console.log('⚠️ [NOTIFICATIONS] Skipped'));
        }, 3000); // Wait 3s before notifications
        
        // Socket.IO (10s timeout, non-blocking)
        setTimeout(() => {
          const socketTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Socket timeout')), 10000);
          });
          Promise.race([socketService.connect(), socketTimeout])
            .then(() => console.log('✅ [SOCKET] Connected'))
            .catch(() => console.log('⚠️ [SOCKET] Skipped'));
        }, 4000); // Wait 4s before Socket.IO
        
        console.log('🎯 [BACKGROUND] All tasks scheduled');
      }, 1000); // Start background tasks after 1 second
      
      // Setup notification listeners immediately (lightweight)
      const unsubscribe = setupNotificationListeners();
      
      // Setup admin transfer listener immediately (lightweight)
      const unsubscribeAdminTransfer = socketService.onAdminTransfer(async (data) => {
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
        } catch (error) {
          console.error('Error saving notification:', error);
        }
      });
      
      console.log('✅ [INIT] App ready (background tasks running)');
      
      return () => {
        unsubscribe?.();
        unsubscribeAdminTransfer();
      };
    };
    
    initApp();
  }, []);

  // Deep Link Handler for Referral System
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);
      
      const { path, queryParams } = Linking.parse(url);
      
      // Check if it's a signup referral link
      if (path === 'signup' && queryParams?.ref) {
        const referralCode = queryParams.ref as string;
        console.log('🎁 Referral code detected:', referralCode);
        
        // Store referral code in AsyncStorage
        await AsyncStorage.setItem('pending_referral_code', referralCode);
        console.log('💾 Referral code stored in AsyncStorage');
      }
    };

    // Handle initial URL (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Handle subsequent deep links (app already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CreditsProvider>
        <ForceUpdateModal
          visible={updateRequired}
          updateUrl={updateUrl}
          currentVersion={getCurrentAppVersion()}
          latestVersion={latestVersion}
        />
        <Stack screenOptions={{ headerShown: false }} />
      </CreditsProvider>
    </QueryClientProvider>
  );
}
