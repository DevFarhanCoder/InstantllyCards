import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { queryClient } from "../lib/query";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import serverWarmup from "../lib/serverWarmup";
import ForceUpdateModal from "../components/ForceUpdateModal";
import {
  checkAppVersion,
  getCurrentAppVersion,
  getAppStoreUrl,
} from "../lib/versionCheck";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { socketService } from "@/lib/socket";
import { getPlayStoreReferrer } from "@/lib/playStoreReferrer";
import { checkAndRefreshCreditsOnUpdate } from "@/lib/creditsRefresh";

SplashScreen.preventAutoHideAsync().catch(() => { });


export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState(getAppStoreUrl());
  const [latestVersion, setLatestVersion] = useState("1.0.0");

  useEffect(() => {
    // Ultra-lightweight initialization - NOTHING synchronous
    const initApp = async () => {
      // All operations run in background after 100ms to allow navigation
      setTimeout(async () => {
        // Check credits refresh
        checkAndRefreshCreditsOnUpdate().catch(() => { });

        // Version check (5s timeout)
        setTimeout(async () => {
          try {
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(
                () => reject(new Error("Version check timeout")),
                5000,
              );
            });
            const versionInfo = await Promise.race([
              checkAppVersion(),
              timeoutPromise,
            ]);

            if (versionInfo && versionInfo.updateRequired) {
              setUpdateRequired(true);
              setUpdateUrl(versionInfo.updateUrl);
              setLatestVersion(versionInfo.latestVersion);
            }
          } catch (error) {
            // Silently fail
          }
        }, 2000);

        // Play Store referrer
        getPlayStoreReferrer().catch(() => { });

        // Server warmup
        serverWarmup.preWarmOnAppStart().catch(() => { });

        // Socket.IO (10s timeout)
        setTimeout(() => {
          const socketTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Socket timeout")), 10000);
          });
          Promise.race([socketService.connect(), socketTimeout]).catch(
            () => { },
          );
        }, 4000);

        // Setup admin transfer listener
        const unsubscribeAdminTransfer = socketService.onAdminTransfer(
          async (data) => {
            try {
              const existingNotifications = await AsyncStorage.getItem(
                "admin_transfer_notifications",
              );
              const notifications = existingNotifications
                ? JSON.parse(existingNotifications)
                : [];
              notifications.push({
                groupId: data.groupId,
                groupName: data.groupName,
                fromUser: data.fromUser || "Unknown",
                message: data.message,
                timestamp: data.timestamp || new Date(),
                seen: false,
              });
              await AsyncStorage.setItem(
                "admin_transfer_notifications",
                JSON.stringify(notifications),
              );
            } catch (error) {
              // Silently fail
            }
          },
        );

        return () => {
          unsubscribeAdminTransfer();
        };
      }, 100); // Start all tasks after just 100ms
    };

    initApp().catch(() => { });
  }, []);

  // Deep Link Handler for Referral System
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      const { path, queryParams } = Linking.parse(url);

      if (path === "signup" && queryParams?.ref) {
        const referralCode = queryParams.ref as string;
        await AsyncStorage.setItem("pending_referral_code", referralCode);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        // allow router to mount
        await new Promise((resolve) => setTimeout(resolve, 300));
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!appReady) {
    return null;
  }


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
